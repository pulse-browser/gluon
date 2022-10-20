// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { bin_name } from '..'
import { ENGINE_DIR } from '../constants'
import { log } from '../log'
import { config, dispatch } from '../utils'

export const run = async (chrome?: string) => {
  const directories = readdirSync(ENGINE_DIR)
  const objectDirname = directories.find((directory) =>
    directory.startsWith('obj-')
  )

  if (!objectDirname) {
    throw new Error(`${config.name} needs to be built before you can do this.`)
  }

  const objectDirectory = resolve(ENGINE_DIR, objectDirname)

  if (existsSync(objectDirectory)) {
    dispatch(
      './mach',
      ['run', ...(chrome ? ['-chrome', chrome] : [])],
      ENGINE_DIR,
      true
    )
  } else {
    log.error(
      `Unable to locate any built binaries.\nRun |${bin_name} build| to initiate a build.`
    )
  }
}
