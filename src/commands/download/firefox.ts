import execa from 'execa'
import { existsSync } from 'fs'
import { dirname, resolve } from 'path'
import { bin_name } from '../..'
import { BASH_PATH, ENGINE_DIR, MELON_TMP_DIR } from '../../constants'
import { log } from '../../log'
import { commandExistsSync } from '../../utils/commandExists'
import { downloadFileToLocation } from '../../utils/download'
import { ensureDir, windowsPathToUnix } from '../../utils/fs'
import { init } from '../init'

export function shouldSetupFirefoxSource() {
  return !(
    existsSync(ENGINE_DIR) &&
    existsSync(resolve(ENGINE_DIR, 'toolkit', 'moz.build'))
  )
}

export async function setupFirefoxSource(version: string) {
  const firefoxSourceTar = await downloadFirefoxSource(version)

  await unpackFirefoxSource(firefoxSourceTar)

  if (!process.env.CI_SKIP_INIT) {
    log.info('Init firefox')
    await init(ENGINE_DIR)
  }
}

async function unpackFirefoxSource(name: string): Promise<void> {
  log.info(`Unpacking Firefox...`)

  ensureDir(ENGINE_DIR)

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

async function downloadFirefoxSource(version: string) {
  const base = `https://archive.mozilla.org/pub/firefox/releases/${version}/source/`
  const filename = `firefox-${version}.source.tar.xz`

  const url = base + filename

  const fsParent = MELON_TMP_DIR
  const fsSaveLocation = resolve(fsParent, filename)

  log.info(`Locating Firefox release ${version}...`)

  await ensureDir(dirname(fsSaveLocation))

  if (existsSync(fsSaveLocation)) {
    log.info('Using cached download')
    return filename
  }

  // Do not re-download if there is already an existing workspace present
  if (existsSync(ENGINE_DIR))
    log.error(
      `Workspace already exists.\nRemove that workspace and run |${bin_name} download ${version}| again.`
    )

  log.info(`Downloading Firefox release ${version}...`)

  await downloadFileToLocation(url, resolve(MELON_TMP_DIR, filename))
  return filename
}
