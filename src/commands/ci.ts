// Code to handle common, complex tasks that our CI servers have to do to get
// ready to build everything

import { inc, ReleaseType } from 'semver'
import { config } from '..'
import { log } from '../log'
import { dynamicConfig, saveConfig } from '../utils'

interface Options {
  brand?: string
  bump?: ReleaseType
  displayVersion?: string
}

export const ci = (options: Options) => {
  log.info('Set the build to release')
  dynamicConfig.set('buildMode', 'release')

  if (options.brand) {
    log.info(`Setting the brand to be '${options.brand}'`)
    dynamicConfig.set('brand', options.brand)
  }

  if (options.bump) {
    const oldVersion =
      config.brands[dynamicConfig.get('brand')].release.displayVersion
    const version = inc(
      config.brands[dynamicConfig.get('brand')].release.displayVersion,
      options.bump
    )

    config.brands[dynamicConfig.get('brand')].release.displayVersion =
      version ||
      config.brands[dynamicConfig.get('brand')].release.displayVersion
    saveConfig()

    log.info(`Bumped the version: ${oldVersion} → ${version}`)
  }

  if (options.displayVersion) {
    config.brands[dynamicConfig.get('brand')].release.displayVersion =
      options.displayVersion ||
      config.brands[dynamicConfig.get('brand')].release.displayVersion
    saveConfig()

    log.info(
      `Loaded version: ${
        config.brands[dynamicConfig.get('brand')].release.displayVersion
      } → ${options.displayVersion}`
    )
  }
}
