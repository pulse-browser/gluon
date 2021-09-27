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
