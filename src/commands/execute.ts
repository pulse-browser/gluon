// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { existsSync } from 'node:fs'
import { log } from '../log'
import { ENGINE_DIR } from '../constants'
import { dispatch } from '../utils'

export const execute = async (cmd: string[]) => {
  if (existsSync(ENGINE_DIR)) {
    if (!cmd || cmd.length === 0)
      log.error('You need to specify a command to run.')

    const bin = cmd[0]
    const arguments_ = cmd
    arguments_.shift()

    log.info(
      `Executing \`${bin}${arguments_.length > 0 ? ` ` : ``}${arguments_.join(
        ' '
      )}\` in \`src\`...`
    )
    dispatch(bin, arguments_, ENGINE_DIR)
  } else {
    log.error(`Unable to locate src directory.`)
  }
}
