// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
/**
 * Responsible for checking if all new patches have been applied
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { log } from '../log'
import { MELON_DIR, SRC_DIR } from '../constants'
import { walkDirectory } from '../utils'

export const patchCountFile = resolve(MELON_DIR, 'patchCount')

export const patchCheck = async (): Promise<void> => {
  const directoryCotnents = await walkDirectory(resolve(SRC_DIR))

  const fileList = directoryCotnents.filter((file) => file.endsWith('.patch'))
  const patchCount = fileList.length

  if (!existsSync(patchCountFile)) writeFileSync(patchCountFile, '0')

  const recordedPatchCount = Number(readFileSync(patchCountFile).toString())

  if (patchCount !== recordedPatchCount) {
    await log.hardWarning(
      'You have not imported all of your patches. This may lead to unexpected behavior'
    )
  }
}
