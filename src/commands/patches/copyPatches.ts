import { sync } from 'glob'
import { existsSync } from 'fs'
import { lstatSync, readFileSync } from 'fs'
import { ensureSymlink } from 'fs-extra'
import { copyFile } from 'fs/promises'
import { resolve } from 'path'
import rimraf from 'rimraf'

import { appendToFileSync } from '../../utils'
import { config } from '../..'
import { ENGINE_DIR, SRC_DIR } from '../../constants'

// =============================================================================
// Utilities

const getChunked = (location: string) => location.replace(/\\/g, '/').split('/')

export const copyManual = async (name: string): Promise<void> => {
  // If the file exists and is not a symlink, we want to replace it with a
  // symlink to our file, so remove it
  if (
    existsSync(resolve(ENGINE_DIR, ...getChunked(name))) &&
    !lstatSync(resolve(ENGINE_DIR, ...getChunked(name))).isSymbolicLink()
  ) {
    rimraf.sync(resolve(ENGINE_DIR, ...getChunked(name)))
  }

  if (
    process.platform == 'win32' &&
    !config.buildOptions.windowsUseSymbolicLinks
  ) {
    // By default, windows users do not have access to the permissions to create
    // symbolic links. As a work around, we will just copy the files instead
    await copyFile(
      resolve(SRC_DIR, ...getChunked(name)),
      resolve(ENGINE_DIR, ...getChunked(name))
    )
  } else {
    // Create the symlink
    await ensureSymlink(
      resolve(SRC_DIR, ...getChunked(name)),
      resolve(ENGINE_DIR, ...getChunked(name))
    )
  }

  const gitignore = readFileSync(resolve(ENGINE_DIR, '.gitignore'), 'utf-8')

  if (!gitignore.includes(getChunked(name).join('/')))
    appendToFileSync(
      resolve(ENGINE_DIR, '.gitignore'),
      `\n${getChunked(name).join('/')}`
    )
}

// =============================================================================
// Data types

export interface ICopyPatch {
  name: string
  src: string[]
}

// =============================================================================
// Exports

export function get(): ICopyPatch[] {
  const manualPatches: ICopyPatch[] = []

  sync('**/*', {
    nodir: true,
    cwd: SRC_DIR,
  })
    .filter(
      (f) => !(f.endsWith('.patch') || f.split('/').includes('node_modules'))
    )
    .map((folder) => folder.split('/')[0])
    .forEach((name, _index, array) => {
      if (manualPatches.find((patch) => patch.name == name)) return
      manualPatches.push({ name, src: array.filter((patch) => patch == name) })
    })

  return manualPatches
}

export async function apply(src: string[]): Promise<void> {
  for (const item of src) {
    await copyManual(item)
  }
}
