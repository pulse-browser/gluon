/**
 * Responsible for loading, parsing and checking the config file for melon
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

import { log } from '..'

const configDir = process.cwd()
const configPath = join(configDir, 'melon.json')

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
    version: string
    /**
     * The version of your output product. E.g. 1.3.5
     * This is in relation to the product you are building. For example, for
     * dothq, it might be Dot Browser 1.3.5
     */
    displayVersion: string
  }
}

const defaultConfig: Config = {
  name: 'Unknown melon build',
  version: {
    product: SupportedProducts.Firefox,
    version: '92.0',
    displayVersion: '1.0.0',
  },
}

export function getConfig(): Config {
  const configExists = existsSync(configDir)

  if (!configExists) {
    log.error(`Config file not found at ${configDir}`)
    process.exit(1)
  }

  const fileContents = readFileSync(configPath)
  let fileParsed: Config

  try {
    // Try to parse the contents of the file. May not be valid JSON
    fileParsed = JSON.parse(fileContents.toString())
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
