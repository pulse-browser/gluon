import { readdir, stat } from 'fs/promises'
import { join, isAbsolute } from 'path'

import { log } from '..'

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
