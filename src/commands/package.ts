// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { existsSync } from 'fs'
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  stat,
  unlink,
  writeFile,
} from 'fs/promises'
import { dirname, join, resolve } from 'path'
import { parse } from 'ini'
import { create } from 'xmlbuilder2'
import { createHash } from 'crypto'
import { isAppleSilicon } from 'is-apple-silicon'

import { bin_name, config } from '..'
import { DIST_DIR, ENGINE_DIR, OBJ_DIR } from '../constants'
import { log } from '../log'
import {
  configDispatch,
  dispatch,
  dynamicConfig,
  ensureEmpty,
  ReleaseInfo,
  windowsPathToUnix,
} from '../utils'

const machPath = resolve(ENGINE_DIR, 'mach')

/**
 * These are all of the different platforms that aus should deploy to. Note that
 * the names have been simplified and they are all only the ones that are
 * supported by Pulse Browser. If you need something else, open an issue on gh.
 *
 * Based off the code from mozrelease:
 * https://searchfox.org/mozilla-central/source/python/mozrelease/mozrelease/platforms.py
 * https://searchfox.org/mozilla-central/source/taskcluster/gecko_taskgraph/util/partials.py
 */
const ausPlatformsMap = {
  linux64: ['Linux_x86_64-gcc3'],
  macosIntel: [
    'Darwin_x86_64-gcc3-u-i386-x86_64',
    'Darwin_x86-gcc3-u-i386-x86_64',
    'Darwin_x86-gcc3',
    'Darwin_x86_64-gcc3',
  ],
  macosArm: ['Darwin_aarch64-gcc3'],
  win64: ['WINNT_x86_64-msvc', 'WINNT_x86_64-msvc-x64'],
}

export const melonPackage = async () => {
  // The engine directory must have been downloaded for this to be valid
  // TODO: Make this a reusable function that can be used by everything
  if (!existsSync(ENGINE_DIR)) {
    log.error(
      `Unable to locate any source directories.\nRun |${bin_name} download| to generate the source directory.`
    )
  }

  if (!existsSync(machPath)) {
    log.error(`Cannot locate the 'mach' binary within ${ENGINE_DIR}`)
  }

  const args = ['package']

  log.info(
    `Packaging \`${config.binaryName}\` with args ${JSON.stringify(
      args.slice(1, 0)
    )}...`
  )

  await dispatch(machPath, args, ENGINE_DIR, true)

  log.info('Copying results up')

  log.debug("Creating the dist directory if it doesn't exist")
  if (!existsSync(DIST_DIR)) await mkdir(DIST_DIR, { recursive: true })

  log.debug('Indexing files to copy')
  const files = (await readdir(join(OBJ_DIR, 'dist'), { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)

  for (const file of files) {
    const destFile = join(DIST_DIR, file)
    log.debug(`Copying ${file}`)
    if (existsSync(destFile)) await unlink(destFile)
    await copyFile(join(OBJ_DIR, 'dist', file), destFile)
  }

  // Windows has some special dist files that are available within the dist
  // directory.
  if (process.platform == 'win32') {
    const installerDistDirectory = join(OBJ_DIR, 'dist', 'install', 'sea')

    if (!existsSync(installerDistDirectory)) {
      log.error(
        `Could not find windows installer files located at '${installerDistDirectory}'`
      )
    }

    const windowsInstallerFiles = (
      await readdir(installerDistDirectory, { withFileTypes: true })
    )
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)

    for (const file of windowsInstallerFiles) {
      let newFileName = file

      // There are some special cases that I want to reformat the name for
      if (file.includes('.installer.exe')) {
        newFileName = `${config.binaryName}.installer.exe`
      }
      if (file.includes('.installer-stub.exe')) {
        newFileName = `${config.binaryName}.installer.pretty.exe`
        log.warning(
          `The installer ${newFileName} requires that your binaries are available from the internet and everything is correctly configured. I recommend you ship '${config.binaryName}.installer.exe' if you have not set this up correctly yet`
        )
      }

      // Actually copy
      const destFile = join(DIST_DIR, newFileName)
      log.debug(`Copying ${file}`)
      if (existsSync(destFile)) await unlink(destFile)
      await copyFile(join(installerDistDirectory, file), destFile)
    }
  }

  log.info()
  log.info(`Output written to ${DIST_DIR}`)

  const brandingKey = dynamicConfig.get('brand')
  const brandingDetails = config.brands[brandingKey]

  const version = brandingDetails.release.displayVersion
  const channel = brandingKey || 'unofficial'

  const marPath = await createMarFile(version, channel)

  log.info('Creating AUS update files')

  await generateUpdateFile(marPath, version, channel, brandingDetails.release)

  log.success('Packaging complected!')
}

function getReleaseMarName(releaseInfo: ReleaseInfo): string | undefined {
  if (isAppleSilicon()) {
    log.askForReport()
    log.warning('Apple silicon is not yet supported by the distribution script')
    return
  }

  switch (process.platform) {
    case 'win32':
      return releaseInfo.x86?.windowsMar
    case 'darwin':
      return releaseInfo.x86?.macosMar
    case 'linux':
      return releaseInfo.x86?.linuxMar
  }
}

async function generateUpdateFile(
  marPath: string,
  version: string,
  channel: string,
  releaseInfo: ReleaseInfo
) {
  // We need the sha512 hash of the mar file for the update file. AUS will use
  // this to ensure that the mar file has not been modified on the distribution
  // server
  const marHash = createHash('sha512')
  marHash.update(await readFile(marPath))

  // We need platform information, primarily for the BuildID, but other stuff
  // might be helpful later
  let platformINI = join(OBJ_DIR, 'dist', config.binaryName, 'platform.ini')
  if (!existsSync(platformINI))
    platformINI = join(OBJ_DIR, 'dist', 'bin', 'platform.ini')

  const platform = parse((await readFile(platformINI)).toString())

  const releaseMarName = getReleaseMarName(releaseInfo)
  let completeMarURL = `https://${config.updateHostname || 'localhost:8000'}/${
    releaseMarName || 'output.mar'
  }`

  // The user is using github to distribute release binaries for this version.
  if (releaseInfo.github) {
    completeMarURL = `https://github.com/${releaseInfo.github.repo}/releases/download/${version}/${releaseMarName}`
    log.info(`Using '${completeMarURL}' as the distribution url`)
  } else {
    log.warning(
      `No release information found! Default release location will be "${completeMarURL}"`
    )
  }

  const updateObject = {
    updates: {
      update: {
        // TODO: Correct update type from semvar, store the old version somewhere
        '@type': 'minor',
        '@displayVersion': version,
        '@appVersion': version,
        '@platformVersion': config.version.version,
        '@buildID': platform.Build.BuildID,

        patch: {
          // TODO: Partial patches might be nice for download speed
          '@type': 'complete',
          '@URL': completeMarURL,
          '@hashFunction': 'sha512',
          '@hashValue': marHash.digest('hex'),
          '@size': (await stat(marPath)).size,
        },
      },
    },
  }

  for (const target of getArchFolders()) {
    const xmlPath = join(
      DIST_DIR,
      'update',
      'browser',
      target,
      channel,
      'update.xml'
    )
    const document = create(updateObject)

    ensureEmpty(dirname(xmlPath))
    await writeFile(xmlPath, document.end({ prettyPrint: true }))
  }
}

async function createMarFile(version: string, channel: string) {
  log.info(`Creating mar file...`)
  let marBinary: string = join(OBJ_DIR, 'dist/host/bin', 'mar')

  if (process.platform == 'win32') {
    marBinary += '.exe'
  }

  // On macos this should be
  // <obj dir>/dist/${binaryName}/${brandFullName}.app and on everything else,
  // the contents of the folder <obj dir>/dist/${binaryName}
  let binary: string

  if (process.platform == 'darwin') {
    binary = join(
      OBJ_DIR,
      'dist',
      config.binaryName,
      `${getCurrentBrandName()}.app`
    )
  } else {
    binary = join(OBJ_DIR, 'dist', config.binaryName)
  }

  const marPath = windowsPathToUnix(join(DIST_DIR, 'output.mar'))
  await configDispatch('./tools/update-packaging/make_full_update.sh', {
    args: [
      // The mar output location
      windowsPathToUnix(join(DIST_DIR)),
      binary,
    ],
    cwd: ENGINE_DIR,
    env: {
      MOZ_PRODUCT_VERSION: version,
      MAR_CHANNEL_ID: channel,
      MAR: marBinary,
    },
  })
  return marPath
}

function getArchFolders(): string[] {
  if (process.platform == 'win32') {
    return ausPlatformsMap.win64
  }

  if (process.platform == 'linux') {
    return ausPlatformsMap.linux64
  }

  // Everything else will have to be darwin of some kind. So, for future possible
  // Apple silicon support, we should chose between the two wisely
  // TODO: This is a hack, fix it
  if (isAppleSilicon()) {
    return ausPlatformsMap.macosArm
  }

  return ausPlatformsMap.macosIntel
}

function getCurrentBrandName(): string {
  const brand = dynamicConfig.get('brand')

  if (brand == 'unofficial') {
    return 'Nightly'
  }

  return config.brands[brand].brandFullName
}
