// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { existsSync, readdirSync } from 'fs'
import { resolve } from 'path'
import { bin_name } from '..'
import { ENGINE_DIR } from '../constants'
import { log } from '../log'
import { config, dispatch } from '../utils'

export const run = async (chrome?: string) => {
  const dirs = readdirSync(ENGINE_DIR)
  const objDirname: any = dirs.find((dir) => dir.startsWith('obj-'))

  if (!objDirname) {
    throw new Error(`${config.name} needs to be built before you can do this.`)
  }

  const objDir = resolve(ENGINE_DIR, objDirname)

  if (existsSync(objDir)) {
    dispatch(
      './mach',
      ['run'].concat(chrome ? ['-chrome', chrome] : []),
      ENGINE_DIR,
      true
    )
  } else {
    log.error(
      `Unable to locate any built binaries.\nRun |${bin_name} build| to initiate a build.`
    )
  }
}
