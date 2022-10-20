// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { config } from '..'
import { ENGINE_DIR } from '../constants'
import { log } from '../log'
import { configDispatch } from '../utils'

export const bootstrap = async () => {
  log.info(`Bootstrapping ${config.name}...`)

  const arguments_ = ['--application-choice', 'browser']

  console.debug(`Passing through to |mach bootstrap|`)
  await configDispatch('./mach', {
    args: ['bootstrap', ...arguments_],
    cwd: ENGINE_DIR,
  })
}
