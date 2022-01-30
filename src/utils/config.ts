/**
 * Responsible for loading, parsing and checking the config file for melon
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { BIN_NAME } from '../constants'

import { log } from '../log'

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

export interface LicenseConfig {
  /**
   * What license you intend to put your project under. Currently MPL is the
   * only one supported by the license checker, but if you want implement more
   * please feel free to open a pull request.
   *
   * To disable the license checker, set this type to `unknown`
   */
  licenseType: 'MPL-2.0' | 'unknown'
  /**
   * Files to be ignored by the license checker. For default values see the
   * `defaultConfig` variable in the config.ts file
   *
   * These should be rejex tests because compiled regex tests are **really**
   * fast which will stop the license checker from becoming absurdly slow with
   * larger projects
   */
  ignoredFiles: string[]
}

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
  /**
   * The license check config
   */
  license: LicenseConfig
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
    generateBranding: boolean
    windowsUseSymbolicLinks: boolean
  }
  addons: Record<string, { id: string; url: string }>
  brands: Record<
    string,
    {
      backgroundColor: string
      brandShorterName: string
      brandShortName: string
      brandFullName: string
    }
  >
}

export const defaultBrandsConfig = {
  backgroundColor: '#2B2A33',
  brandShorterName: 'Nightly',
  brandShortName: 'Nightly',
  brandFullName: 'Nightly',
}

export const defaultLicenseConfig: LicenseConfig = {
  ignoredFiles: ['.*\\.json'],
  licenseType: 'MPL-2.0',
}

export const defaultConfig: Config = {
  name: 'Unknown gluon build',
  vendor: 'Unknown',
  appId: 'unknown.appid',
  binaryName: 'firefox',
  version: {
    product: SupportedProducts.Firefox,
    displayVersion: '1.0.0',
  },
  buildOptions: {
    generateBranding: true,
    windowsUseSymbolicLinks: false,
  },
  addons: {},
  brands: {},
  license: defaultLicenseConfig,
}

export function hasConfig(): boolean {
  return existsSync(configPath)
}

let mockConfig = ''

export function setMockRawConfig(config: string): void {
  mockConfig = config
}

export function rawConfig(): string {
  if (mockConfig != '') {
    return mockConfig
  }

  const configExists = hasConfig()

  let contents = '{}'

  if (configExists) {
    contents = readFileSync(configPath, 'utf8')
  } else {
    if (!hasWarnedAboutConfig) {
      log.warning(
        `Config file not found at ${configPath}. It is recommended to create one by running |${BIN_NAME} setup-project|`
      )
      hasWarnedAboutConfig = true
    }
  }

  return contents
}

export function getConfig(): Config {
  const fileContents = rawConfig()
  let fileParsed: Config

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

  fileParsed.license = { ...defaultLicenseConfig, ...fileParsed.license }

  // ===========================================================================
  // Config Validation

  if (!validProducts.includes(fileParsed.version.product)) {
    log.error(`${fileParsed.version.product} is not a valid product`)
    process.exit(1)
  }

  return fileParsed
}

export const config = getConfig()
