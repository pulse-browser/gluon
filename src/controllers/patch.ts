import chalk from 'chalk'
import { info } from 'console'
import execa from 'execa'
import { copyFileSync } from 'fs'
import {
  existsSync,
  mkdirpSync,
  readFileSync,
  rmdirSync,
  rmSync,
  statSync,
} from 'fs-extra'
import { dirname, join, resolve } from 'path'
import readline from 'readline'
import sharp from 'sharp'
import { log } from '..'
import { CONFIGS_DIR, ENGINE_DIR, PATCH_ARGS } from '../constants'
import { copyManual, walkDirectory } from '../utils'

export interface IPatchApplier {
  apply: () => Promise<void>
  applyWithStatus: (status: [number, number]) => Promise<void>
}

export class PatchBase {
  protected name: string

  protected status: number[]

  protected options: {
    minimal?: boolean
    noIgnore?: boolean
  }

  private _done = false

  protected error: Error | unknown

  constructor(
    name: string,
    status: number[],
    options: {
      minimal?: boolean
      noIgnore?: boolean
    } = {}
  ) {
    this.name = name
    this.status = status
    this.options = options
  }

  protected get done(): boolean {
    return this._done
  }

  protected set done(_: boolean) {
    this._done = _

    if (this.options.minimal) return

    // Move to the start of the last line
    readline.moveCursor(process.stdout, 0, -1)
    readline.clearLine(process.stdout, 1)

    // Print the status
    log.info(
      `${chalk.gray(`(${this.status[0]}/${this.status[1]})`)} Applying ${
        this.name
      }... ${chalk[this._done ? 'green' : 'red'].bold(
        this._done ? 'Done ✔' : 'Error ❗'
      )}`
    )

    // If there is an error present, it should be thrown
    if (this.error) {
      throw this.error
    }
  }

  protected start(): void {
    if (this.options.minimal) return

    log.info(
      `${chalk.gray(`(${this.status[0]}/${this.status[1]})`)} Applying ${
        this.name
      }...`
    )
  }

  public async applyWithStatus(status: [number, number]): Promise<void> {
    this.status = status
    if (!(this as unknown as IPatchApplier).apply) return
    await (this as unknown as IPatchApplier).apply()
  }
}

export class ManualPatch extends PatchBase implements IPatchApplier {
  private action: 'copy' | 'delete'

  private src: string | string[]

  constructor(
    name: string,
    status: number[],
    options: {
      minimal?: boolean
      noIgnore?: boolean
    } = {},
    action: 'copy' | 'delete',
    src: string | string[]
  ) {
    super(name, status, options)

    this.action = action
    this.src = src
  }

  private delete(parent: string, loc: string) {
    const target = resolve(parent, loc)

    if (!existsSync(target)) {
      log.error(
        `We were unable to delete the file or directory \`${this.src}\` as it doesn't exist in the src directory.`
      )

      return
    }

    const targetInfo = statSync(target)

    if (targetInfo.isDirectory()) {
      rmdirSync(target)
    } else {
      rmSync(target, { force: true })
    }
  }

  async apply(): Promise<void> {
    this.start()

    try {
      switch (this.action) {
        case 'copy':
          if (typeof this.src === 'string') {
            copyManual(this.src, this.options.noIgnore)
          } else if (Array.isArray(this.src)) {
            for (const item of this.src) {
              copyManual(item, this.options.noIgnore)
            }
          } else {
            throw new Error(
              `'${this.src}' is not a valid source. Please provide a string or an array`
            )
          }

          break

        case 'delete':
          if (typeof this.src === 'string') {
            this.delete(ENGINE_DIR, this.src)
          } else if (Array.isArray(this.src)) {
            for (const item of this.src) {
              this.delete(ENGINE_DIR, item)
            }
          } else {
            throw new Error(
              `'${this.src}' is not a valid source. Please provide a string or an array`
            )
          }

          break

        default:
          throw new Error(`Unknown manual patch action: ${this.action}`)
      }

      this.done = true
    } catch (e) {
      this.error = e
      this.done = false
    }
  }
}

export class PatchFile extends PatchBase implements IPatchApplier {
  private src: string

  constructor(
    name: string,
    status: number[],
    options: {
      minimal?: boolean
      noIgnore?: boolean
    } = {},
    src: string
  ) {
    super(name, status, options)
    this.src = src
  }

  async apply(): Promise<void> {
    this.start()

    try {
      try {
        await execa('git', ['apply', '-R', ...PATCH_ARGS, this.src], {
          cwd: ENGINE_DIR,
        })
      } catch (e) {
        null
      }

      const { stdout, exitCode } = await execa(
        'git',
        ['apply', ...PATCH_ARGS, this.src],
        { cwd: ENGINE_DIR }
      )

      if (exitCode != 0) throw stdout

      this.done = true
    } catch (e) {
      this.error = e
      this.done = false
    }
  }
}

const BRANDING_DIR = join(CONFIGS_DIR, 'branding')
const BRANDING_FF = join(ENGINE_DIR, 'browser', 'branding', 'unofficial')

export class BrandingPatch extends PatchBase implements IPatchApplier {
  constructor(minimal?: boolean) {
    super('Browser branding', [1, 1], { minimal })
  }

  async apply(): Promise<void> {
    this.start()

    if (!existsSync(BRANDING_DIR)) {
      this.done = true

      info("No branding specified. Using firefox's default")
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
