import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  writeFileSync,
} from 'fs'
import { dirname, extname, join } from 'path'
import sharp from 'sharp'
import { config, log } from '..'
import { templateDir } from '../commands'

import { CONFIGS_DIR, ENGINE_DIR } from '../constants'
import {
  defaultBrandsConfig,
  mkdirpSync,
  stringTemplate,
  walkDirectory,
} from '../utils'
import { PatchBase } from './patch'

export const BRANDING_DIR = join(CONFIGS_DIR, 'branding')
const BRANDING_STORE = join(ENGINE_DIR, 'browser', 'branding')
const BRANDING_FF = join(BRANDING_STORE, 'unofficial')

const CSS_REPLACE_REGEX = new RegExp(
  '#130829|hsla\\(235, 43%, 10%, .5\\)',
  'gm'
)

export class BrandingPatch extends PatchBase {
  name: string

  outputPath: string
  configPath: string

  constructor(name: string) {
    super(`Browser branding: ${name}`)
    this.name = name

    this.outputPath = join(BRANDING_STORE, name)
    this.configPath = join(BRANDING_DIR, name)
  }

  private checkForFaults(): void {
    if (!existsSync(this.configPath)) {
      throw new Error(`Branding ${this.name} does not exist`)
    }

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
    this.checkForFaults()

    const brandingConfig = {
      brandingGenericName: config.name,
      brandingVendor: config.vendor,

      ...defaultBrandsConfig,
      ...(config.brands[this.name] || {}),
    }

    if (existsSync(this.outputPath))
      rmdirSync(this.outputPath, { recursive: true })
    mkdirSync(this.outputPath, { recursive: true })

    await this.setupImages()

    this.setupLocales(brandingConfig)

    await this.copyMozillaFiles(brandingConfig)
  }

  private async copyMozillaFiles(brandingConfig: {
    backgroundColor: string
    brandShorterName: string
    brandShortName: string
    brandFullName: string
  }) {
    const files = (await walkDirectory(BRANDING_FF)).filter(
      (file) =>
        !existsSync(join(this.outputPath, file.replace(BRANDING_FF, '')))
    )

    const css = files.filter((file) => extname(file).includes('css'))

    const everythingElse = files.filter((file) => !css.includes(file))

    css
      .map((filePath) => [
        readFileSync(filePath, 'utf-8'),
        join(this.outputPath, filePath.replace(BRANDING_FF, '')),
      ])
      .map(([contents, path]) => [
        contents.replace(CSS_REPLACE_REGEX, 'var(--theme-bg)') +
          `:root { --theme-bg: ${brandingConfig.backgroundColor} }`,
        path,
      ])
      .forEach(([contents, path]) => {
        mkdirSync(dirname(path), { recursive: true })
        writeFileSync(path, contents)
      })

    // Copy everything else from the default firefox branding directory
    everythingElse.forEach((file) => {
      mkdirpSync(dirname(join(this.outputPath, file.replace(BRANDING_FF, ''))))
      copyFileSync(file, join(this.outputPath, file.replace(BRANDING_FF, '')))
    })
  }

  private setupLocales(brandingConfig: {
    backgroundColor: string
    brandShorterName: string
    brandShortName: string
    brandFullName: string
  }) {
    readdirSync(join(templateDir, 'branding.optional'))
      .map((file) => [
        readFileSync(join(templateDir, 'branding.optional', file), 'utf-8'),
        join(this.outputPath, 'locales/en-US', file),
      ])
      .forEach(([contents, path]) => {
        mkdirSync(dirname(path), { recursive: true })
        writeFileSync(path, stringTemplate(contents, brandingConfig))
      })
  }

  private async setupImages() {
    for (const size of [16, 22, 24, 32, 48, 64, 128, 256]) {
      await sharp(join(this.configPath, 'logo.png'))
        .resize(size, size)
        .toFile(join(this.outputPath, `default${size}.png`))
    }

    await sharp(join(this.configPath, 'logo.png'))
      .resize(512, 512)
      .toFile(join(this.outputPath, 'firefox.ico'))
    await sharp(join(this.configPath, 'logo.png'))
      .resize(64, 64)
      .toFile(join(this.outputPath, 'firefox64.ico'))

    mkdirSync(join(this.outputPath, 'content'), { recursive: true })

    await sharp(join(this.configPath, 'logo.png'))
      .resize(512, 512)
      .toFile(join(this.outputPath, 'content', 'about-logo.png'))
    await sharp(join(this.configPath, 'logo.png'))
      .resize(1024, 1024)
      .toFile(join(this.outputPath, 'content', 'about-logo@2x.png'))
  }
}
