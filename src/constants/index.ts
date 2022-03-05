import execa from 'execa'
import { existsSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'
import { log } from '..'
import { listDrives } from '../utils'

export const BUILD_TARGETS = ['linux', 'windows', 'macos']

export const ARCHITECTURE = ['i686', 'x86_64']

export const PATCH_ARGS = [
  '--ignore-space-change',
  '--ignore-whitespace',
  '--verbose',
]

export const ENGINE_DIR = resolve(process.cwd(), 'engine')
export const SRC_DIR = resolve(process.cwd(), 'src')
export const PATCHES_DIR = resolve(process.cwd(), 'patches')
export const COMMON_DIR = resolve(process.cwd(), 'common')
export const CONFIGS_DIR = resolve(process.cwd(), 'configs')
export const MELON_DIR = resolve(process.cwd(), '.dotbuild')
export const MELON_TMP_DIR = resolve(process.cwd(), '.dotbuild', 'engine')
/**
 * The path to git bash on windows. Reuired for some operations
 * @windows
 */
export let BASH_PATH: string | null = null
/**
 * The path to the mozilla build install
 * @windows
 */
export let MOZILLA_BUILD: string | null = null

mkdirSync(MELON_TMP_DIR, { recursive: true })

export let CONFIG_GUESS: string = ''

// We should only try and generate this config file if the engine directory has
// been created
if (existsSync(ENGINE_DIR)) {
  if (!existsSync(resolve(ENGINE_DIR, 'build/autoconf/config.guess'))) {
    log.warning(
      'The engine directory has been created, but has not been build properly.'
    )
  } else {
    try {
      CONFIG_GUESS = execa.commandSync('./build/autoconf/config.guess', {
        cwd: ENGINE_DIR,
      }).stdout
    } catch (e) {
      log.warning(`Windows moment ${(e as any).toString()}`)
      log.warning(
        'Its probibly nothing, you should be able to ignore it. Its just the NT kernal being pain'
      )
      log.warning('')
    }
  }
}

if (process.platform == 'win32') {
  if (execa.sync('where.exe git.exe').stdout.toString().includes('git.exe')) {
    let gitPath = execa.sync('where.exe git.exe').stdout.toString()
    log.info(`Found git at ${gitPath}`)
    BASH_PATH = resolve(gitPath, '../..', 'bin/bash.exe')
    log.info(`Found bash at ${BASH_PATH}`)
  }
}

// Find the location of mozilla-build
if (process.platform == 'win32') {
  for (const drive of listDrives()) {
    const mozPath = join(drive, 'mozilla-build')

    if (existsSync(mozPath)) {
      MOZILLA_BUILD = mozPath
      log.info(`Using MOZILLABUILD at ${MOZILLA_BUILD}`)
      break
    }
  }

  if (!MOZILLA_BUILD) {
    log.warning('There is no MOZILLABUILD program installed on your computer')
    log.warning(
      'Go install one from: https://ftp.mozilla.org/pub/mozilla.org/mozilla/libraries/win32/MozillaBuildSetup-Latest.exe'
    )

    process.exit(1)
  }
}

export const OBJ_DIR = resolve(ENGINE_DIR, `obj-${CONFIG_GUESS}`)

export const FTL_STRING_LINE_REGEX =
  /(([a-zA-Z0-9-]*|\.[a-z-]*) =(.*|\.)|\[[a-zA-Z0-9]*\].*(\n\s?\s?})?|\*\[[a-zA-Z0-9]*\] .*(\n\s?\s?})?)/gm
