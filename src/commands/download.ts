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
  initializeAddon,
  resolveAddonDownloadUrl,
  unpackAddon,
} from './download/addon'

export const download = async (): Promise<void> => {
  const version = config.version.version

  // If gFFVersion isn't specified, provide legible error
  if (!version) {
    log.error(
      'You have not specified a version of firefox in your config file. This is required to build a firefox fork'
    )
    process.exit(1)
  }

  const addons = Object.keys(config.addons).map((addon) => ({
    name: addon,
    ...config.addons[addon],
  }))

  if (shouldSetupFirefoxSource()) {
    await setupFirefoxSource(version)
  }

  for (const addon of addons) {
    const downloadUrl = await resolveAddonDownloadUrl(addon)
    const downloadedXPI = await downloadAddon(downloadUrl, addon)

    if (!downloadedXPI) {
      log.info(`Skipping ${addon.name}... Already installed`)
      continue
    }

    await unpackAddon(downloadedXPI, addon)
    await generateAddonMozBuild(addon)
    await initializeAddon(addon)
  }

  await addAddonsToMozBuild(addons)

  log.success(
    `You should be ready to make changes to ${config.name}.`,
    '',
    `You should import the patches next, run |${bin_name} import|.`,
    `To begin building ${config.name}, run |${bin_name} build|.`
  )
  console.log()
}
