import { copyFileSync, existsSync, rmSync } from 'fs'
import { mkdirpSync } from 'fs-extra'
import { dirname, join } from 'path'
import sharp from 'sharp'

import { CONFIGS_DIR, ENGINE_DIR } from '../constants'
import { walkDirectory } from '../utils'
import { PatchBase } from './patch'
import { log } from '..'

const BRANDING_DIR = join(CONFIGS_DIR, 'branding')
const BRANDING_FF = join(ENGINE_DIR, 'browser', 'branding', 'unofficial')

export class BrandingPatch extends PatchBase {
  constructor(minimal?: boolean) {
    super('Browser branding', [1, 1], { minimal })
  }

  async apply(): Promise<void> {
    this.start()

    if (!existsSync(BRANDING_DIR)) {
      this.done = true

      log.info("No branding specified. Using firefox's default")
      return
    }

    try {
      if (!existsSync(join(BRANDING_DIR, 'logo.png'))) {
        throw new Error(`Please provide a "logo.png" file inside of "${BRANDING_DIR}" if you wish to use branding
\n\nAlternatively, you can delete "${BRANDING_DIR}" to use firefox's trademarkless branding`)
      }

      // Ensure the destination directory structure exists
      const dest = join(ENGINE_DIR, 'branding', 'melon')
      mkdirpSync(dest)

      // Delete the old branding
      ;(await walkDirectory(dest))
        .filter((file) => file.includes('default.png'))
        .forEach((file) => rmSync(file, { force: true }))

      for (const size of [16, 22, 24, 32, 48, 64, 128, 256]) {
        await sharp(join(BRANDING_DIR, 'logo.png'))
          .resize(size, size)
          .toFile(join(dest, `default${size}.png`))
      }

      await sharp(join(BRANDING_DIR, 'logo.png'))
        .resize(512, 512)
        .toFile(join(dest, 'firefox.ico'))
      await sharp(join(BRANDING_DIR, 'logo.png'))
        .resize(64, 64)
        .toFile(join(dest, 'firefox64.ico'))

      // Copy everything else from the default firefox branding directory
      ;(await walkDirectory(BRANDING_FF))
        .filter(
          (file) => !existsSync(join(dest, file.replace(BRANDING_FF, '')))
        )
        .forEach((file) => {
          mkdirpSync(dirname(join(dest, file.replace(BRANDING_FF, ''))))
          copyFileSync(file, join(dest, file.replace(BRANDING_FF, '')))
        })

      this.done = true
    } catch (e) {
      this.error = e
      this.done = false
    }
  }
}
