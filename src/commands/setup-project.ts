// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { copyFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'

import prompts from 'prompts'

import { log } from '../log'
import {
  Config,
  configPath,
  delay,
  getLatestFF,
  projectDirectory,
  SupportedProducts,
  walkDirectory,
} from '../utils'

// =============================================================================
// User interaction portion

export async function setupProject(): Promise<void> {
  try {
    if (existsSync(configPath)) {
      log.warning('There is already a config file. This will overwrite it!')
      await delay(1000)
    }

    if (configPath.includes('.optional')) {
      log.error(
        'The text ".optional" cannot be in the path to your custom browser'
      )
      process.exit(1)
    }

    // Ask user for assorted information
    const { product } = await prompts({
      type: 'select',
      name: 'product',
      message: 'Select a product to fork',
      choices: [
        { title: 'Firefox stable', value: SupportedProducts.Firefox },
        {
          title: 'Firefox extended support',
          value: SupportedProducts.FirefoxESR,
        },
        {
          title: 'Firefox developer edition (Not recommended)',
          value: SupportedProducts.FirefoxDevelopment,
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

    if (typeof product === 'undefined') return

    const productVersion = await getLatestFF(product)

    const { version, name, appId, vendor, ui } = await prompts([
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
      {
        type: 'select',
        name: 'ui',
        message: 'Select a ui mode template',
        choices: [
          {
            title: 'None',
            value: 'none',
          },
          {
            title: 'User Chrome (custom browser css, simplest)',
            value: 'uc',
          },
          {
            title: 'Custom html',
            value: 'html',
          },
        ],
      },
    ])

    const config: Partial<Config> = {
      name,
      vendor,
      appId,
      version: { product, version },
      buildOptions: {
        generateBranding: false,
        windowsUseSymbolicLinks: false,
      },
    }

    await copyRequired()

    if (ui === 'html') {
      await copyOptional([
        'customui',
        'toolkit-mozbuild.patch',
        'confvars-sh.patch',
      ])
    } else if (ui === 'uc') {
      await copyOptional(['browser/themes'])
    }

    writeFileSync(configPath, JSON.stringify(config, undefined, 2))

    // Append important stuff to gitignore
    const gitignore = join(projectDirectory, '.gitignore')
    let gitignoreContents = ''

    if (existsSync(gitignore)) {
      gitignoreContents = readFileSync(gitignore).toString()
    }

    gitignoreContents += '\n.dotbuild/\nengine/\nfirefox-*/\nnode_modules/\n'

    writeFileSync(gitignore, gitignoreContents)
  } catch (error) {
    console.log(error)
  }
}

// =============================================================================
// Filesystem templating

// eslint-disable-next-line unicorn/prefer-module
export const templateDirectory = join(__dirname, '../..', 'template')

/**
 * Copy files from the template directory that have .optional in their path,
 * based on the function parameters
 *
 * @param files The files that should be coppied
 */
async function copyOptional(files: string[]) {
  const directoryContents = await walkDirectory(templateDirectory)

  for (const file of directoryContents) {
    if (
      !file.includes('.optional') &&
      !files
        .map((induvidualFile) => file.includes(induvidualFile))
        .some(Boolean)
    )
      continue

    const outLocation = join(
      projectDirectory,
      file.replace(templateDirectory, '')
    ).replace('.optional', '')

    if (!existsSync(outLocation)) {
      mkdirSync(dirname(outLocation), { recursive: true })
      await copyFile(file, outLocation)
    }
  }
}

/**
 * Copy all non-optional files from the template directory
 */
async function copyRequired() {
  const directoryContents = await walkDirectory(templateDirectory)

  for (const file of directoryContents) {
    if (file.includes('.optional')) continue

    const outLocation = join(
      projectDirectory,
      file.replace(templateDirectory, '')
    )

    if (!existsSync(outLocation)) {
      mkdirSync(dirname(outLocation), { recursive: true })
      await copyFile(file, outLocation)
    }
  }
}
