import { mkdirSync, readdirSync } from 'fs'
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

/**
 * What we think the current platform might be. Should not be used outside of this
 * file
 */
let CONFIG_GUESS: string = ''

// We can find the current obj-* dir simply by searching. This shouldn't be to
// hard and is more reliable than autoconf is
{
  const possibleFolders = readdirSync(ENGINE_DIR, {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((entry) => entry.startsWith('obj-'))
    .map((entry) => entry.replace('obj-', ''))

  if (possibleFolders.length === 0)
    log.debug(
      "There are no obj-* folders. This may mean you haven't completed a build yet"
    )
  else if (possibleFolders.length === 1) CONFIG_GUESS = possibleFolders[0]
  else {
    log.warning(
      `There are multiple obj-* folders. Defaulting to obj-${possibleFolders[0]}`
    )
    CONFIG_GUESS = possibleFolders[0]
  }
}

export const OBJ_DIR = resolve(ENGINE_DIR, `obj-${CONFIG_GUESS}`)

export const FTL_STRING_LINE_REGEX =
  /(([a-zA-Z0-9-]*|\.[a-z-]*) =(.*|\.)|\[[a-zA-Z0-9]*\].*(\n\s?\s?})?|\*\[[a-zA-Z0-9]*\] .*(\n\s?\s?})?)/gm
