import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import { isMatch } from 'picomatch'
import { ENGINE_DIR, MELON_TMP_DIR } from '../../constants'
import { log } from '../../log'

import {
  AddonInfo,
  configDispatch,
  delay,
  ensureDir,
  walkDirectoryTree,
  windowsPathToUnix,
} from '../../utils'
import { downloadFileToLocation } from '../../utils/download'
import { readItem } from '../../utils/store'
import { discard } from '../discard'

export async function resolveAddonDownloadUrl(
  addon: AddonInfo
): Promise<string> {
  switch (addon.platform) {
    case 'url':
      return addon.url

    case 'amo':
      return (
        await (
          await fetch(
            `https://addons.mozilla.org/api/v4/addons/addon/${addon.amoId}/versions/`
          )
        ).json()
      ).results[0].files[0].url

    case 'github':
      return (
        (
          ((
            await (
              await fetch(
                `https://api.github.com/repos/${addon.repo}/releases/tags/${addon.version}`
              )
            ).json()
          ).assets as {
            url: string
            browser_download_url: string
            name: string
          }[]) || []
        ).find((asset) => isMatch(asset.name, addon.fileGlob))
          ?.browser_download_url || 'failed'
      )
  }
}

export async function downloadAddon(
  url: string,
  addon: AddonInfo & { name: string }
): Promise<string | false> {
  const tempFile = join(MELON_TMP_DIR, addon.name + '.xpi')
  const outPath = join(ENGINE_DIR, 'browser', 'extensions', addon.name)

  log.info(`Download addon from ${url}`)

  if (existsSync(outPath)) {
    // Now we need to do some tests. First, if there is no cache file,
    // we must discard the existing folder and download the file again.
    // If there is a cache file and the cache file points to the same path
    // we can return and skip the download.

    const extensionCache = readItem<{ url: string }>(addon.name)

    if (extensionCache.isNone()) {
      // We haven't stored it in the cache, therefore we need to redonwload
      // it
    } else {
      const cache = extensionCache.unwrap()
      if (cache.url == url) {
        return false
      }
    }
  }

  if (existsSync(tempFile)) {
    unlinkSync(tempFile)
  }

  await downloadFileToLocation(url, tempFile)

  // I do not know why, but this delay causes unzip to work reliably
  await delay(200)

  return tempFile
}

export async function unpackAddon(
  path: string,
  addon: AddonInfo & { name: string }
) {
  const outPath = join(ENGINE_DIR, 'browser', 'extensions', addon.name)

  log.info(`Unpacking extension...`)

  // I do not know why, but this delay causes unzip to work reliably
  await delay(200)

  ensureDir(outPath)

  await configDispatch('unzip', {
    args: [windowsPathToUnix(path), '-d', windowsPathToUnix(outPath)],
    killOnError: true,
    shell: 'unix',
  })
}

export async function generateAddonMozBuild(
  addon: AddonInfo & { name: string }
) {
  const outPath = join(ENGINE_DIR, 'browser', 'extensions', addon.name)

  log.info(`Generating addon mozbuild...`)

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
            `FINAL_TARGET_FILES.features["${addon.id}"]${parent} += ["${file
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
          `FINAL_TARGET_FILES.features["${addon.id}"]${parent} += ["${f
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
}

export async function initializeAddon(addon: AddonInfo & { name: string }) {
  const outPath = join(ENGINE_DIR, 'browser', 'extensions', addon.name)

  log.info(`Initializing addon...`)

  await configDispatch('git', {
    args: ['add', '-f', '.'],
    cwd: outPath,
  })
  await configDispatch('git', {
    args: ['commit', '-m', addon.name],
    cwd: ENGINE_DIR,
  })
}

export async function addAddonsToMozBuild(
  addons: (AddonInfo & { name: string })[]
) {
  log.info('Adding addons to mozbuild...')

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
}
