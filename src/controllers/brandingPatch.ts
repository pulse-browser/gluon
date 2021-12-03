import { copyFileSync, existsSync, mkdirSync, rmdirSync, rmSync } from 'fs'
import { mkdirpSync } from 'fs-extra'
import { dirname, join } from 'path'
import sharp from 'sharp'
import { log } from '..'

import { CONFIGS_DIR, ENGINE_DIR } from '../constants'
import { walkDirectory } from '../utils'
import { PatchBase } from './patch'

export const BRANDING_DIR = join(CONFIGS_DIR, 'branding')
const BRANDING_STORE = join(ENGINE_DIR, 'browser', 'branding')
const BRANDING_FF = join(BRANDING_STORE, 'unofficial')

export class BrandingPatch extends PatchBase {
  name: string

  outputPath: string
  configPath: string

  constructor(name: string, minimal?: boolean) {
    super(`Browser branding: ${name}`, [0, 0], { minimal })
    this.name = name

    this.outputPath = join(BRANDING_STORE, name)
    this.configPath = join(BRANDING_DIR, name)
  }

  private checkForFaults(): void {
    const requiredFiles = ['logo.png'].map((file) =>
      join(this.configPath, file)
    )
    const requiredFilesExist = this.filesExist(requiredFiles)

    if (!requiredFilesExist) {
      throw new Error(
        `Missing some of the required files: ${requiredFiles
          .filter((file) => !existsSync(file))
          .join(', ')}`
      )
    }
  }

  async apply(): Promise<void> {
    this.start()

    try {
      log.debug('Checking branding files')

      if (!existsSync(this.configPath)) {
        throw new Error(`Branding ${this.name} does not exist`)
      }

      this.checkForFaults()

      log.debug(`Creating folder ${this.outputPath}`)

      if (existsSync(this.outputPath))
        rmdirSync(this.outputPath, { recursive: true })
      mkdirSync(this.outputPath, { recursive: true })

      log.debug('Creating default*.png files')

      for (const size of [16, 22, 24, 32, 48, 64, 128, 256]) {
        await sharp(join(this.configPath, 'logo.png'))
          .resize(size, size)
          .toFile(join(this.outputPath, `default${size}.png`))
      }

      log.debug('Creating firefox*.ico')

      await sharp(join(this.configPath, 'logo.png'))
        .resize(512, 512)
        .toFile(join(this.outputPath, 'firefox.ico'))
      await sharp(join(this.configPath, 'logo.png'))
        .resize(64, 64)
        .toFile(join(this.outputPath, 'firefox64.ico'))

      log.debug('Creating content/about-logo*.png')

      mkdirSync(join(this.outputPath, 'content'), { recursive: true })

      await sharp(join(this.configPath, 'logo.png'))
        .resize(512, 512)
        .toFile(join(this.outputPath, 'content', 'about-logo.png'))
      await sharp(join(this.configPath, 'logo.png'))
        .resize(1024, 1024)
        .toFile(join(this.outputPath, 'content', 'about-logo@2x.png'))

      log.debug(`Copying files from ${BRANDING_FF}`)

      // Copy everything else from the default firefox branding directory
      ;(await walkDirectory(BRANDING_FF))
        .filter(
          (file) =>
            !existsSync(join(this.outputPath, file.replace(BRANDING_FF, '')))
        )
        .forEach((file) => {
          mkdirpSync(
            dirname(join(this.outputPath, file.replace(BRANDING_FF, '')))
          )
          copyFileSync(
            file,
            join(this.outputPath, file.replace(BRANDING_FF, ''))
          )
        })

      this.done = true
    } catch (e) {
      this.error = e
      this.done = false
    }
  }
}
