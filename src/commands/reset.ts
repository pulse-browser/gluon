// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import execa from 'execa'

import { bin_name } from '..'
import { ENGINE_DIR } from '../constants'
import { log } from '../log'

export const reset = async (): Promise<void> => {
  log.warning(`This will remove any changes that you have made to firefox`)
  log.warning(
    `If you have made changes to firefox's internal files, save them with |${bin_name} export [filename]|`
  )
  await log.hardWarning(
    `You will need to run |${bin_name} import| to bring back your saved changes`
  )

  log.info('Unstaging changes...')
  await execa('git', ['reset'], { cwd: ENGINE_DIR })

  log.info('Reverting uncommitted changes...')
  await execa('git', ['checkout', '.'], { cwd: ENGINE_DIR })

  log.info('Removing all untracked files...')
  await execa('git', ['clean', '-fdx'], { cwd: ENGINE_DIR })
}
