// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { existsSync } from 'fs'
import { copyFile, mkdir, mkdtemp, readdir, unlink } from 'fs/promises'
import { platform } from 'os'
import { join, resolve } from 'path'
import { bin_name, config } from '..'
import { DIST_DIR, ENGINE_DIR, OBJ_DIR } from '../constants'
import { log } from '../log'
import { configDispatch, dispatch, dynamicConfig, ensureEmpty } from '../utils'

const machPath = resolve(ENGINE_DIR, 'mach')

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
  log.info(`Preparing to create the mar file...`)

  const version = config.version.displayVersion
  const channel = config.version.channel || 'default'

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

  await configDispatch('./tools/update-packaging/make_full_update.sh', {
    args: [
      // The mar output location
      join(DIST_DIR),
      binary,
    ],
    cwd: ENGINE_DIR,
    env: {
      MOZ_PRODUCT_VERSION: version,
      MAR_CHANNEL_ID: channel,
      MAR: marBinary,
    },
  })

  log.success('Packaging complected!')
}

function getCurrentBrandName(): string {
  const brand = dynamicConfig.get('brand')

  if (brand == 'unofficial') {
    return 'Nightly'
  }

  return config.brands[brand].brandFullName
}
