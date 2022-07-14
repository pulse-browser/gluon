// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs'
import { copyFile } from 'fs/promises'
import { join, dirname } from 'path'

import prompts from 'prompts'

import { log } from '../log'
import {
  Config,
  configPath,
  delay,
  getLatestFF,
  projectDir,
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
        {
          title: 'Firefox stable',
          description: 'Releases around every 4 weeks, fairly stable',
          value: SupportedProducts.Firefox,
        },
        {
          title: 'Firefox extended support (older)',
          description:
            'The oldest supported extended support release. Maximum security and stability, but will lose support sooner than the newer extended support release.',
          value: SupportedProducts.FirefoxESR,
        },
        {
          title: 'Firefox extended support (newer)',
          description:
            'The latest extended support release. Releases around once every 8 stable cycles. Receives regular small security patches and bug fixes.',
          value: SupportedProducts.FirefoxESRNext,
        },
        {
          title: 'Firefox developer edition (Not recommended)',
          description: 'Tracks firefox beta, with a few config tweaks',
          value: SupportedProducts.FirefoxDev,
        },
        {
          title: 'Firefox beta (Not recommended)',
          description: 'Updates every 4 weeks. It will have unresolved bugs',
          value: SupportedProducts.FirefoxBeta,
        },
        {
          title: 'Firefox Nightly (Not recommended)',
          description:
            'Updates daily, with many bugs. Practically impossible to track',
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
            description:
              'No files for the ui will be created, we will let you find that out on your own',
            value: 'none',
          },
          {
            title: 'UserChrome',
            value: 'uc',
          },
          // TODO: We also need to add extension based theming like the version
          // used in Pulse Browser
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

    if (ui === 'uc') {
      await copyOptional(['browser/themes'])
    }

    writeFileSync(configPath, JSON.stringify(config, null, 2))

    // Append important stuff to gitignore
    const gitignore = join(projectDir, '.gitignore')
    let gitignoreContents = ''

    if (existsSync(gitignore)) {
      gitignoreContents = readFileSync(gitignore).toString()
    }

    gitignoreContents += '\n.dotbuild/\nengine/\nfirefox-*/\nnode_modules/\n'

    writeFileSync(gitignore, gitignoreContents)
  } catch (e) {
    console.log(e)
  }
}

// =============================================================================
// Filesystem templating

export const templateDir = join(__dirname, '../..', 'template')

async function copyOptional(files: string[]) {
  await Promise.all(
    (
      await walkDirectory(templateDir)
    )
      .filter((f) => f.includes('.optional'))
      .filter((f) => files.map((file) => f.includes(file)).some((b) => b))
      .map(async (file) => {
        const out = join(projectDir, file.replace(templateDir, '')).replace(
          '.optional',
          ''
        )
        if (!existsSync(out)) {
          mkdirSync(dirname(out), { recursive: true })
          await copyFile(file, out)
        }
      })
  )
}

async function copyRequired() {
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
}
