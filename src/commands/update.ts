// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { existsSync, rmSync } from 'node:fs'

import { bin_name, config } from '..'
import { log } from '../log'
import {
  downloadInternals
} from './download/firefox'
import { getLatestFF } from '../utils'
import { ENGINE_DIR } from '../constants'

export const update = async (): Promise<void> => {
  const version = await getLatestFF(config.version.product)

  // Delete the existing engine directory to download the new version
  if (existsSync(ENGINE_DIR)) rmSync(ENGINE_DIR, { recursive: true })

  await downloadInternals(version)

  log.success(
    `Firefox has successfully been updated to ${version}.`,
    `You should be ready to make changes to ${config.name}.`,
    '',
    `You should import the patches next, run |${bin_name} import|.`,
    `To begin building ${config.name}, run |${bin_name} build|.`
  )
  console.log()
}
