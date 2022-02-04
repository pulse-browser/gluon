import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'fs'
import { homedir } from 'os'
import { join, posix, resolve, sep } from 'path'

import execa from 'execa'
import Listr from 'listr'

import { bin_name, config, log } from '..'
import { BASH_PATH, ENGINE_DIR, MELON_TMP_DIR } from '../constants'
import {
  commandExistsSync,
  delay,
  ensureDir,
  getConfig,
  walkDirectoryTree,
  writeMetadata,
} from '../utils'
import { downloadFileToLocation } from '../utils/download'
import { downloadArtifacts } from './download-artifacts'
import { discard, init } from '.'
import { readItem, writeItem } from '../utils/store'
import { debug } from 'console'

import tar from 'tar'

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

  await new Listr([
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
    // {
    //   title: 'Install windows artifacts',
    //   enabled: (ctx) => process.platform == 'win32',
    //   task: async (ctx) => {
    //     if (existsSync(resolve(homedir(), '.mozbuild'))) {
    //       log.info('Mozbuild directory already exists, not redownloading')
    //     } else {
    //       log.info('Mozbuild not found, downloading artifacts.')
    //       await downloadArtifacts()
    //     }
    //   },
    // },
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
      task: async (ctx, task) => {
        // Discard the file to make sure it has no changes
        await discard('browser/extensions/moz.build', {})

        const path = join(ENGINE_DIR, 'browser', 'extensions', 'moz.build')

        // Append all the files to the bottom
        writeFileSync(
          path,
          `${readFileSync(path, 'utf8')}\nDIRS += [${addons
            .map((addon) => addon.name)
            .sort()
            .map((addon) => `"${addon}"`)
            .join(',')}]`
        )
      },
    },
    {
      title: 'Write metadata',
      task: () => writeMetadata(),
    },
    {
      title: 'Cleanup',
      task: (ctx) => {
        let cwd = process.cwd().split(sep).join(posix.sep)

        if (process.platform == 'win32') {
          cwd = './'
        }

        if (ctx.firefoxSourceTar) {
          unlinkSync(resolve(cwd, '.dotbuild', 'engines', ctx.firefoxSourceTar))
        }
      },
    },
  ]).run()

  log.success(
    `You should be ready to make changes to ${config.name}.\n\n\t   You should import the patches next, run |${bin_name} import|.\n\t   To begin building ${config.name}, run |${bin_name} build|.`
  )
  console.log()
}

const includeAddon = (
  name: string,
  downloadURL: string,
  id: string
): Listr.ListrTask<any>[] => {
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
        const onData = (data: any) => {
          const d = data.toString()

          d.split('\n').forEach((line: any) => {
            if (line.trim().length !== 0) {
              const t = line.split(' ')
              t.shift()
              task.output = t.join(' ')
            }
          })
        }

        task.output = `Unpacking extension...`

        // I do not know why, but this delay causes unzip to work reliably
        await delay(200)

        return await new Promise<void>((res, reg) => {
          if (existsSync(outPath)) {
            rmdirSync(outPath, { recursive: true })
          }

          mkdirSync(outPath, {
            recursive: true,
          })

          const tarProc = execa('unzip', [ctx[name], '-d', outPath])

          tarProc.stdout?.on('data', onData)
          tarProc.stdout?.on('error', (data) => {
            reg(data)
          })

          tarProc.on('exit', async () => {
            task.output = ''
            await writeItem(name, { url: downloadURL })
            res()
          })
        })
      },
    },
    {
      title: 'Generate mozbuild',
      enabled: (ctx) => typeof ctx[name] !== 'undefined',
      task: async (ctx, task) => {
        const files = await walkDirectoryTree(outPath)

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
  ]
}

async function unpackFirefoxSource(
  name: string,
  task: Listr.ListrTaskWrapper<any>
): Promise<void> {
  let cwd = process.cwd().split(sep).join(posix.sep)

  if (process.platform == 'win32') {
    cwd = './'
  }

  task.output = `Extracting Firefox...`

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
        `GNU Tar is required to extract Firefox\'s source on MacOS. Please install it using the command |brew install gnu-tar| and try again`
      )
    }

    tarExec = 'gtar'
  }

  if (process.platform == 'win32') {
    await execa(
      tarExec,
      [
        '--strip-components=1',
        '-xf',
        resolve(cwd, '.dotbuild', 'engines', name),
      ].filter((x) => x) as string[],
      { shell: BASH_PATH || false }
    )
  }

  await execa(
    tarExec,
    [
      '--strip-components=1',
      '-xf',
      resolve(cwd, '.dotbuild', 'engines', name),
    ].filter((x) => x) as string[]
  )
}

async function downloadFirefoxSource(
  version: string,
  task: Listr.ListrTaskWrapper<any>
) {
  const base = `https://archive.mozilla.org/pub/firefox/releases/${version}/source/`
  const filename = `firefox-${version}.source.tar.xz`

  const url = base + filename

  task.output = `Locating Firefox release ${version}...`

  await ensureDir(resolve(process.cwd(), `.dotbuild`, `engines`))

  if (
    existsSync(
      resolve(
        process.cwd(),
        `.dotbuild`,
        `engines`,
        `firefox-${version.split('b')[0]}`
      )
    )
  ) {
    log.error(
      `Cannot download version ${
        version.split('b')[0]
      } as it already exists at "${resolve(
        process.cwd(),
        `firefox-${version.split('b')[0]}`
      )}"`
    )
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
    resolve(process.cwd(), `.dotbuild`, `engines`, filename)
  )
  return filename
}
