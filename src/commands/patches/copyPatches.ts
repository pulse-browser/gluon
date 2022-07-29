// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { premove } from 'premove'
import { existsSync } from 'fs'
import { lstatSync, readFileSync } from 'fs'
import { ensureSymlink } from 'fs-extra'
import { copyFile } from 'fs/promises'
import { dirname, resolve } from 'path'
import glob from 'tiny-glob'

import { appendToFileSync, mkdirp } from '../../utils'
import { config } from '../..'
import { ENGINE_DIR, SRC_DIR } from '../../constants'
import { IMelonPatch } from './command'

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
    await premove(resolve(ENGINE_DIR, ...getChunked(name)))
  }

  if (
    process.platform == 'win32' &&
    !config.buildOptions.windowsUseSymbolicLinks
  ) {
    // Make the directory if it doesn't already exist.
    await mkdirp(dirname(resolve(ENGINE_DIR, ...getChunked(name))))

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

  const gitignore = readFileSync(resolve(ENGINE_DIR, '.gitignore')).toString()

  if (!gitignore.includes(getChunked(name).join('/')))
    appendToFileSync(
      resolve(ENGINE_DIR, '.gitignore'),
      `\n${getChunked(name).join('/')}`
    )
}

// =============================================================================
// Data types

export interface ICopyPatch extends IMelonPatch {
  name: string
  src: string[]
}

// =============================================================================
// Exports

export async function get(): Promise<ICopyPatch[]> {
  const files = (
    await glob('**/*', {
      filesOnly: true,
      cwd: SRC_DIR,
    })
  ).filter(
    (f) => !(f.endsWith('.patch') || f.split('/').includes('node_modules'))
  )

  const manualPatches: ICopyPatch[] = []

  files.map((i) => {
    const group = i.split('/')[0]

    if (!manualPatches.find((m) => m.name == group)) {
      manualPatches.push({
        name: group,
        src: files.filter((f) => f.split('/')[0] == group),
      })
    }
  })

  return manualPatches
}

export async function apply(src: string[]): Promise<void> {
  for (const item of src) {
    await copyManual(item)
  }
}
