/**
 * Responsible for loading, parsing and checking the config file for melon
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

import { log } from '..'

export const projectDir = process.cwd()
export const configPath = join(projectDir, 'melon.json')

let hasWarnedAboutConfig = false

export enum SupportedProducts {
  Firefox = 'firefox',
  FirefoxESR = 'firefox-esr',
  FirefoxESRNext = 'firefox-esr-next',
  FirefoxDev = 'firefox-dev',
  FirefoxBeta = 'firefox-beta',
  FirefoxNightly = 'firefox-nightly',
}

export const validProducts = [
  SupportedProducts.Firefox,
  SupportedProducts.FirefoxESR,
  SupportedProducts.FirefoxESRNext,
  SupportedProducts.FirefoxDev,
  SupportedProducts.FirefoxBeta,
  SupportedProducts.FirefoxNightly,
]

export interface Config {
  /**
   * The name of the product to build
   */
  name: string
  /**
   * The name of the company the build is for
   */
  vendor: string
  /**
   * e.g. co.dothq.melon
   */
  appId: string
  binaryName: string
  version: {
    /**
     * What branch of firefox you are forking. e.g. stable ('firefox'), dev ('firefox-dev')
     * , esr ('firefox-esr') etc.
     *
     * For use in code, use {@link SupportedProducts}
     */
    product: SupportedProducts
    /**
     * The version of the selected product you are forking
     */
    version?: string
    /**
     * The version of your output product. E.g. 1.3.5
     * This is in relation to the product you are building. For example, for
     * dothq, it might be Dot Browser 1.3.5
     */
    displayVersion: string
  }
  buildOptions: {
    /**
     * Artifact builds are faster builds that only work when modifying a limited
     * subset of firefox's source code. They download a majority of the source
     * code from mozilla's servers and build the ui locally. Artifact builds work
     * with ui changes, however do not work with:
     *  - C, C++, Rust or other machine code
     *  - Telemetry histogram definitions
     *  - Some build system definitions
     *
     * Additionally, this will not work for other mozilla products like thunderbird
     * if we ever provide support for those platforms.
     */
    artifactBuilds: boolean

    generateBranding: boolean
  }
}

const defaultConfig: Config = {
  name: 'Unknown melon build',
  vendor: 'Unknown',
  appId: 'unknown.appid',
  binaryName: 'firefox',
  version: {
    product: SupportedProducts.Firefox,
    displayVersion: '1.0.0',
  },
  buildOptions: {
    artifactBuilds: false,
    generateBranding: true,
  },
}

export function hasConfig(): boolean {
  return existsSync(configPath)
}

export function getConfig(): Config {
  const configExists = hasConfig()

  let fileContents = '{}'
  let fileParsed: Config

  if (!configExists) {
    if (!hasWarnedAboutConfig) {
      log.warning(
        `Config file not found at ${configPath}. It is recommended to create one by running |melon setup-project|`
      )
      hasWarnedAboutConfig = true
    }
  } else {
    fileContents = readFileSync(configPath).toString()
  }

  try {
    // Try to parse the contents of the file. May not be valid JSON
    fileParsed = JSON.parse(fileContents)
  } catch (e) {
    // Report the error to the user
    log.error(`Error parsing melon config file located at ${configPath}`)
    log.error(e)
    process.exit(1)
  }

  // Merge the default config with the file parsed config
  fileParsed = { ...defaultConfig, ...fileParsed }

  // ===========================================================================
  // Config Validation

  if (!validProducts.includes(fileParsed.version.product)) {
    log.error(`${fileParsed.version.product} is not a valid product`)
    process.exit(1)
  }

  return fileParsed
}
