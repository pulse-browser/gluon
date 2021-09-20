import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { readdir, stat, copyFile } from 'fs/promises'
import { join, isAbsolute, dirname } from 'path'

import prompts from 'prompts'

import { log } from '..'
import {
  Config,
  configPath,
  getLatestFF,
  projectDir,
  SupportedProducts,
} from '../utils'

// =============================================================================
// User interaction portion

export async function setupProject() {
  try {
    if (existsSync(configPath)) {
      log.warning('There is already a config file. This will overwrite it!')
      await sleep(1000)
    }

    // Ask user for assorted information
    const { product } = await prompts({
      type: 'select',
      name: 'product',
      message: 'Select a product to fork',
      choices: [
        { title: 'Firefox stable', value: SupportedProducts.Firefox },
        {
          title: 'Firefox extended support (older)',
          value: SupportedProducts.FirefoxESR,
        },
        {
          title: 'Firefox extended support (newer)',
          value: SupportedProducts.FirefoxESRNext,
        },
        {
          title: 'Firefox developer edition (Not recommended)',
          value: SupportedProducts.FirefoxDev,
        },
        {
          title: 'Firefox beta (Not recommended)',
          value: SupportedProducts.FirefoxBeta,
        },
        {
          title: 'Firefox Nightly (Not recommended)',
          value: SupportedProducts.FirefoxNightly,
        },
      ],
    })

    if (typeof product == 'undefined') return

    const productVersion = await getLatestFF(product)

    const { version, name, appId, vendor } = await prompts([
      {
        type: 'text',
        name: 'version',
        message: 'Enter the version of this product',
        initial: productVersion,
      },
      {
        type: 'text',
        name: 'name',
        message: 'Enter a product name',
        initial: 'Example browser',
      },
      {
        type: 'text',
        name: 'vendor',
        message: 'Enter a vendor',
        initial: 'Example company',
      },
      {
        type: 'text',
        name: 'appId',
        message: 'Enter an appid',
        initial: 'com.example.browser',
        // Horrible validation to make sure people don't chose something entirely wrong
        validate: (t: string) => t.includes('.'),
      },
    ])

    const config: Config = {
      name,
      vendor,
      appId,
      version: { product, version, displayVersion: '1.0.0' },
    }

    await copyRequired()

    writeFileSync(configPath, JSON.stringify(config, null, 2))
  } catch (e) {
    console.log(e)
  }
}

// =============================================================================
// Filesystem templating

const templateDir = join(__dirname, '../..', 'template')

async function copyRequired() {
  try {
    await Promise.all(
      (
        await walkDirectory(templateDir)
      )
        .filter((f) => !f.includes('.optional'))
        .map(async (file) => {
          const out = join(projectDir, file.replace(templateDir, ''))
          if (!existsSync(out)) {
            mkdirSync(dirname(out), { recursive: true })
            await copyFile(file, out)
          }
        })
    )
  } catch (e) {
    console.log(e)
  }
}

// =============================================================================
// Utility functions

const sleep = (time: number) => new Promise<void>((r) => setTimeout(r, time))

async function walkDirectory(dirName: string): Promise<string[]> {
  const output = []

  if (!isAbsolute(dirName)) {
    log.askForReport()
    log.error('Please provide an absolute input to walkDirectory')
  }

  try {
    const directoryContents = await readdir(dirName)

    for (const file of directoryContents) {
      const fullPath = join(dirName, file)
      const fStat = await stat(fullPath)

      if (fStat.isDirectory()) {
        for (const newFile of await walkDirectory(fullPath)) {
          output.push(newFile)
        }
      } else {
        output.push(fullPath)
      }
    }
  } catch (e) {
    log.askForReport()
    log.error(e)
  }

  return output
}
