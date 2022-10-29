// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { bin_name, config } from '..'
import { log } from '../log'

import {
  setupFirefoxSource,
  shouldSetupFirefoxSource,
} from './download/firefox'
import {
  addAddonsToMozBuild,
  downloadAddon,
  generateAddonMozBuild,
  getAddons,
  initializeAddon,
  resolveAddonDownloadUrl,
  unpackAddon,
} from './download/addon'
import { getLatestFF } from '../utils'
import { rmSync } from 'node:fs'
import { ENGINE_DIR } from '../constants'

export const update = async (): Promise<void> => {
  const version = await getLatestFF(config.version.product)

  // If gFFVersion isn't specified, provide legible error
  if (!version) {
    log.error(
      'You have not specified a version of firefox in your config file. This is required to build a firefox fork.'
    )
    process.exit(1)
  }

  if (!shouldSetupFirefoxSource()) {
    log.info('Remove ' + ENGINE_DIR)
    rmSync(ENGINE_DIR, {
      recursive: true,
      force: true
    })
    log.info('Download Firefox ' + version)
    await setupFirefoxSource(version)
  } else {
    log.error('Firefox is missing, run |gluon download| instead.')
    process.exit(1)
  }

  for (const addon of getAddons()) {
    const downloadUrl = await resolveAddonDownloadUrl(addon)
    const downloadedXPI = await downloadAddon(downloadUrl, addon)

    await unpackAddon(downloadedXPI, addon)
    await generateAddonMozBuild(addon)
    await initializeAddon(addon)
  }

  await addAddonsToMozBuild(getAddons())

  log.success(
    `Firefox has sucessfully been updated to ${version}.`,
    `You should be ready to make changes to ${config.name}.`,
    '',
    `You should import the patches next, run |${bin_name} import|.`,
    `To begin building ${config.name}, run |${bin_name} build|.`
  )
  console.log()
}
