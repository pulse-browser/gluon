// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  rmdirSync,
  writeSync,
} from 'fs'
import { mkdir, readdir, stat, symlink } from 'fs/promises'
import { join, isAbsolute, dirname, relative } from 'path'

import { log } from '../log'

export async function walkDirectory(dirName: string): Promise<string[]> {
  const output = []

  if (!isAbsolute(dirName)) {
    log.askForReport()
    log.error('Please provide an absolute input to walkDirectory')
  }

  try {
    const directoryContents = await readdir(dirName)

    for (const file of directoryContents) {
      const fullPath = join(dirName, file)
      const fStat = await stat(fullPath)

      if (fStat.isDirectory()) {
        for (const newFile of await walkDirectory(fullPath)) {
          output.push(newFile)
        }
      } else {
        output.push(fullPath)
      }
    }
  } catch (e) {
    log.askForReport()
    log.error(e)
  }

  return output
}

export type TreeType<T> = Record<string, T | string[]>

export async function walkDirectoryTree(
  dirName: string
): Promise<TreeType<TreeType<TreeType<TreeType<TreeType<TreeType<any>>>>>>> {
  const output: TreeType<any> = {}

  if (!isAbsolute(dirName)) {
    log.askForReport()
    log.error('Please provide an absolute input to walkDirectory')
  }

  try {
    const directoryContents = await readdir(dirName)

    const currentOut = []

    for (const file of directoryContents) {
      const fullPath = join(dirName, file)
      const fStat = await stat(fullPath)

      if (fStat.isDirectory()) {
        output[file] = await walkDirectoryTree(fullPath)
      } else {
        currentOut.push(fullPath)
      }
    }

    output['.'] = currentOut
  } catch (e) {
    log.askForReport()
    log.error(e)
  }

  return output
}

export async function ensureDir(dirName: string): Promise<void> {
  if (!existsSync(dirName)) {
    await mkdirp(dirName)
  }
}

export function mkdirp(dirName: string): Promise<string | undefined> {
  return mkdir(dirName, { recursive: true })
}

export function mkdirpSync(dirName: string): string | undefined {
  return mkdirSync(dirName, { recursive: true })
}

export function appendToFileSync(fileName: string, content: string): void {
  const file = openSync(fileName, 'a')
  writeSync(file, content)
  closeSync(file)
}

export async function createSymlink(
  srcPath: string,
  destPath: string,
  type?: string
): Promise<void> {
  if (existsSync(destPath)) return

  const { toDest: src } = symlinkPaths(srcPath, destPath)

  const dir = dirname(destPath)
  const exists = existsSync(dir)
  if (exists) return await symlink(src, destPath, type)
  await mkdirp(dir)
  return await symlink(src, destPath, type)
}

/**
 * Adapted from fs-extra
 * @param srcPath
 * @param destPath
 * @returns
 */
export function symlinkPaths(
  srcPath: string,
  destPath: string
): { toCwd: string; toDest: string } {
  if (isAbsolute(srcPath)) {
    if (!existsSync(srcPath)) throw new Error('absolute srcpath does not exist')

    return {
      toCwd: srcPath,
      toDest: srcPath,
    }
  } else {
    const dstdir = dirname(destPath)
    const relativeToDst = join(dstdir, srcPath)
    if (existsSync(relativeToDst))
      return {
        toCwd: relativeToDst,
        toDest: srcPath,
      }
    else {
      if (!existsSync(srcPath))
        throw new Error('relative srcpath does not exist')
      return {
        toCwd: srcPath,
        toDest: relative(dstdir, srcPath),
      }
    }
  }
}

export function filesExist(files: string[]): boolean {
  return files.every((file) => existsSync(file))
}

export function ensureEmpty(path: string) {
  if (existsSync(path)) {
    rmdirSync(path, { recursive: true })
  }

  mkdirSync(path, { recursive: true })
}
