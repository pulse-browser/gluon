import { existsSync } from 'fs'
import { lstatSync, readFileSync } from 'fs'
import { ensureSymlink } from 'fs-extra'
import { copyFile } from 'fs/promises'
import { resolve } from 'path'
import rimraf from 'rimraf'
import { appendToFileSync } from '.'
import { config } from '..'
import { ENGINE_DIR, SRC_DIR } from '../constants'

const getChunked = (location: string) => location.replace(/\\/g, '/').split('/')

export const copyManual = async (
  name: string,
  noIgnore?: boolean
): Promise<void> => {
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

  if (!noIgnore) {
    const gitignore = readFileSync(resolve(ENGINE_DIR, '.gitignore'), 'utf-8')

    if (!gitignore.includes(getChunked(name).join('/')))
      appendToFileSync(
        resolve(ENGINE_DIR, '.gitignore'),
        `\n${getChunked(name).join('/')}`
      )
  }
}
