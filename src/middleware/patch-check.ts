/**
 * Responsible for checking if all new patches have been applied
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { log } from '..'
import { MELON_DIR, SRC_DIR } from '../constants'
import { walkDirectory } from '../utils'

export const patchCountFile = resolve(MELON_DIR, 'patchCount')

export const patchCheck = async (): Promise<void> => {
  const fileList = await walkDirectory(resolve(process.cwd(), 'src'))
  const patchCount = fileList.length

  if (!existsSync(patchCountFile)) {
    writeFileSync(patchCountFile, '0')
  }

  const recordedPatchCount = Number(readFileSync(patchCountFile).toString())

  if (patchCount !== recordedPatchCount) {
    log.hardWarning(
      'You have not imported all of your patches. This may lead to unexpected behavior'
    )
  }
}
