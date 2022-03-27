// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { config } from '..'
import { log } from '../log'
import { getLatestFF } from '../utils'

export const updateCheck = async (): Promise<void> => {
  const firefoxVersion = config.version.version

  try {
    const version = await getLatestFF(config.version.product)

    if (firefoxVersion && version !== firefoxVersion)
      log.warning(
        `Latest version of Firefox (${version}) does not match frozen version (${firefoxVersion}).`
      )
  } catch (e) {
    log.warning(`Failed to check for updates.`)
    log.askForReport()
    log.error(e)
  }
}
