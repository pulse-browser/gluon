// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'fs'
import { join, posix, resolve, sep } from 'path'

import execa from 'execa'
import Listr from 'listr'

import { bin_name, config } from '..'
import { BASH_PATH, ENGINE_DIR, MELON_TMP_DIR } from '../constants'
import {
  commandExistsSync,
  configDispatch,
  delay,
  ensureDir,
  getConfig,
  walkDirectoryTree,
  windowsPathToUnix,
} from '../utils'
import { downloadFileToLocation } from '../utils/download'
import { readItem } from '../utils/store'
import { discard } from './discard'
import { init } from './init'
import { log } from '../log'

const gFFVersion = getConfig().version.version

export const download = async (): Promise<void> => {
  const version = gFFVersion

  // If gFFVersion isn't specified, provide legible error
  if (!version) {
    log.error(
      'You have not specified a version of firefox in your config file. This is required to build a firefox fork'
    )
    process.exit(1)
  }

  const addons = Object.keys(config.addons).map((addon) => ({
    name: addon,
    ...config.addons[addon],
  }))

  // Listr and typescript do not mix. Just specify any and move on with the
  // rest of our life
  //
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await new Listr<Record<string, string | any>>(
    [
      {
        title: 'Downloading firefox source',
        skip: () => {
          if (
            existsSync(ENGINE_DIR) &&
            existsSync(resolve(ENGINE_DIR, 'toolkit', 'moz.build'))
          ) {
            return 'Firefox has already been downloaded, unpacked and inited'
          }
        },
        task: async (ctx, task) => {
          ctx.firefoxSourceTar = await downloadFirefoxSource(version, task)
        },
      },
      {
        title: 'Unpack firefox source',
        enabled: (ctx) => ctx.firefoxSourceTar,
        task: async (ctx, task) => {
          await unpackFirefoxSource(ctx.firefoxSourceTar, task)
        },
      },
      {
        title: 'Init firefox',
        enabled: (ctx) => ctx.firefoxSourceTar && !process.env.CI_SKIP_INIT,
        task: async (_ctx, task) => await init(ENGINE_DIR, task),
      },
      ...addons
        .map((addon) => includeAddon(addon.name, addon.url, addon.id))
        .reduce((acc, cur) => [...acc, ...cur], []),
      {
        title: 'Add addons to mozbuild',
        task: async () => {
          // Discard the file to make sure it has no changes
          await discard('browser/extensions/moz.build')

          const path = join(ENGINE_DIR, 'browser', 'extensions', 'moz.build')

          // Append all the files to the bottom
          writeFileSync(
            path,
            `${readFileSync(path).toString()}\nDIRS += [${addons
              .map((addon) => addon.name)
              .sort()
              .map((addon) => `"${addon}"`)
              .join(',')}]`
          )
        },
      },
      {
        title: 'Cleanup',
        task: (ctx) => {
          if (ctx.firefoxSourceTar) {
            if (typeof ctx.firefoxSourceTar !== 'string') {
              log.askForReport()
              log.error(
                `The type ctx.firefoxSourceTar was ${typeof ctx.firefoxSourceTar} when it should have been a string`
              )
              return
            }

            unlinkSync(resolve(MELON_TMP_DIR, ctx.firefoxSourceTar))
          }
        },
      },
    ],
    {
      renderer: log.isDebug ? 'verbose' : 'default',
    }
  ).run()

  log.success(
    `You should be ready to make changes to ${config.name}.\n\n\t   You should import the patches next, run |${bin_name} import|.\n\t   To begin building ${config.name}, run |${bin_name} build|.`
  )
  console.log()
}

const includeAddon = (
  name: string,
  downloadURL: string,
  id: string
): Listr.ListrTask<Record<string, string>>[] => {
  const tempFile = join(MELON_TMP_DIR, name + '.xpi')
  const outPath = join(ENGINE_DIR, 'browser', 'extensions', name)

  return [
    {
      title: `Download addon from ${downloadURL}`,
      skip: () => {
        if (existsSync(outPath)) {
          // Now we need to do some tests. First, if there is no cache file,
          // we must discard the existing folder and download the file again.
          // If there is a cache file and the cache file points to the same path
          // we can return and skip the download.

          const extensionCache = readItem<{ url: string }>(name)

          if (extensionCache.isNone()) {
            // We haven't stored it in the cache, therefore we need to redonwload
            // it
          } else {
            const cache = extensionCache.unwrap()
            if (cache.url == downloadURL) {
              return `${downloadURL} has already been loaded to ${name}`
            }
          }
        }
      },
      task: async (ctx, task) => {
        if (existsSync(tempFile)) {
          unlinkSync(tempFile)
        }

        await downloadFileToLocation(
          downloadURL,
          tempFile,
          (msg) => (task.output = msg)
        )
        ctx[name] = tempFile

        // I do not know why, but this delay causes unzip to work reliably
        await delay(200)
      },
    },
    {
      title: `Unpack to ${name}`,
      enabled: (ctx) => typeof ctx[name] !== 'undefined',
      task: async (ctx, task) => {
        task.output = `Unpacking extension...`

        // I do not know why, but this delay causes unzip to work reliably
        await delay(200)

        if (existsSync(outPath)) {
          rmdirSync(outPath, { recursive: true })
        }

        mkdirSync(outPath, {
          recursive: true,
        })

        await configDispatch('unzip', {
          args: [
            windowsPathToUnix(ctx[name]),
            '-d',
            windowsPathToUnix(outPath),
          ],
          killOnError: true,
          logger: (data) => (task.output = data),
          shell: 'unix',
        })
      },
    },
    {
      title: 'Generate mozbuild',
      enabled: (ctx) => typeof ctx[name] !== 'undefined',
      task: async () => {
        const files = await walkDirectoryTree(outPath)

        // Because the tree has the potential of being infinitely recursive, we
        // cannot possibly know the the type of the tree
        //
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function runTree(tree: any, parent: string): string {
          if (Array.isArray(tree)) {
            return tree
              .sort()
              .map(
                (file) =>
                  `FINAL_TARGET_FILES.features["${id}"]${parent} += ["${file
                    .replace(outPath + '/', '')
                    .replace(outPath, '')}"]`
              )
              .join('\n')
          }

          const current = (tree['.'] as string[])
            .sort()
            // Don't use windows path, which brick mozbuild
            .map((f) => windowsPathToUnix(f))
            .map(
              (f) =>
                `FINAL_TARGET_FILES.features["${id}"]${parent} += ["${f
                  .replace(outPath + '/', '')
                  .replace(outPath, '')}"]`
            )
            .join('\n')

          const children = Object.keys(tree)
            .filter((folder) => folder !== '.')
            .filter((folder) => typeof tree[folder] !== 'undefined')
            .map((folder) => runTree(tree[folder], `${parent}["${folder}"]`))
            .join('\n')

          return `${current}\n${children}`
        }

        writeFileSync(
          join(outPath, 'moz.build'),
          `
DEFINES["MOZ_APP_VERSION"] = CONFIG["MOZ_APP_VERSION"]
DEFINES["MOZ_APP_MAXVERSION"] = CONFIG["MOZ_APP_MAXVERSION"]

${runTree(files, '')}`
        )
      },
    },
    {
      // This step allows patches to be applied to extensions that are downloaded
      // providing more flexibility to the browser developers
      title: 'Initializing',
      enabled: (ctx) => typeof ctx[name] !== 'undefined',
      task: async (ctx, task) => {
        await configDispatch('git', {
          args: ['add', '-f', '.'],
          cwd: outPath,
          logger: (data) => (task.output = data),
        })
        await configDispatch('git', {
          args: ['commit', '-m', name],
          cwd: ENGINE_DIR,
          logger: (data) => (task.output = data),
        })
      },
    },
  ]
}

async function unpackFirefoxSource(
  name: string,
  task: Listr.ListrTaskWrapper<never>
): Promise<void> {
  let cwd = process.cwd().split(sep).join(posix.sep)

  if (process.platform == 'win32') {
    cwd = './'
  }

  task.output = `Unpacking Firefox...`

  if (existsSync(ENGINE_DIR)) rmdirSync(ENGINE_DIR)
  mkdirSync(ENGINE_DIR)

  let tarExec = 'tar'

  // On MacOS, we need to use gnu tar, otherwise tar doesn't behave how we
  // would expect it to behave, so this section is responsible for handling
  // that
  //
  // If BSD tar adds --transform support in the future, we can use that
  // instead
  if (process.platform == 'darwin') {
    // GNU Tar doesn't come preinstalled on any MacOS machines, so we need to
    // check for it and ask for the user to install it if necessary
    if (!commandExistsSync('gtar')) {
      throw new Error(
        `GNU Tar is required to extract Firefox's source on MacOS. Please install it using the command |brew install gnu-tar| and try again`
      )
    }

    tarExec = 'gtar'
  }

  await execa(
    tarExec,
    [
      '--strip-components=1',
      process.platform == 'win32' ? '--force-local' : null,
      '-xf',
      windowsPathToUnix(resolve(MELON_TMP_DIR, name)),
      '-C',
      windowsPathToUnix(ENGINE_DIR),
    ].filter((x) => x) as string[],
    {
      // HACK: Use bash shell on windows to get a sane version of tar that works
      shell: BASH_PATH || false,
    }
  )
}

// TODO: Make this function cache its output
async function downloadFirefoxSource(
  version: string,
  task: Listr.ListrTaskWrapper<never>
) {
  const base = `https://archive.mozilla.org/pub/firefox/releases/${version}/source/`
  const filename = `firefox-${version}.source.tar.xz`

  const url = base + filename

  const fsParent = MELON_TMP_DIR
  const fsSaveLocation = resolve(fsParent, filename)

  task.output = `Locating Firefox release ${version}...`

  await ensureDir(fsParent)

  if (existsSync(fsSaveLocation)) {
    task.output = 'Using cached download'
    return filename
  }

  if (version.includes('b'))
    task.output =
      'WARNING Version includes non-numeric characters. This is probably a beta.'

  // Do not re-download if there is already an existing workspace present
  if (existsSync(ENGINE_DIR)) {
    log.error(
      `Workspace already exists.\nRemove that workspace and run |${bin_name} download ${version}| again.`
    )
  }

  task.output = `Downloading Firefox release ${version}...`

  await downloadFileToLocation(
    url,
    resolve(MELON_TMP_DIR, filename),
    (message) => (task.output = message)
  )
  return filename
}
