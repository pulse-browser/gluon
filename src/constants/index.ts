import execa from 'execa'
import { existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { log } from '..'

export const BIN_NAME = 'gluon'

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
export const MELON_DIR = resolve(process.cwd(), '.gluon')
export const MELON_TMP_DIR = resolve(MELON_DIR, 'engine')
export const DIST_DIR = resolve(process.cwd(), 'dist')

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
      log.warning(
        'An error occurred running engine/build/autoconf/config.guess'
      )
      log.info(e)
    }
  }
}

export const OBJ_DIR = resolve(ENGINE_DIR, `obj-${CONFIG_GUESS}`)

export const FTL_STRING_LINE_REGEX =
  /(([a-zA-Z0-9-]*|\.[a-z-]*) =(.*|\.)|\[[a-zA-Z0-9]*\].*(\n\s?\s?})?|\*\[[a-zA-Z0-9]*\] .*(\n\s?\s?})?)/gm
