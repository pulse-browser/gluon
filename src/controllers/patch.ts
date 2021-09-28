import { throws } from 'assert'
import chalk from 'chalk'
import execa from 'execa'
import { existsSync, rmdirSync, rmSync, statSync } from 'fs-extra'
import { resolve } from 'path'
import readline from 'readline'
import { log } from '..'
import { ENGINE_DIR, PATCH_ARGS, SRC_DIR } from '../constants'
import { copyManual } from '../utils'

export interface IPatchApplier {
  apply: () => Promise<void>
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

  protected get done() {
    return this._done
  }

  protected set done(_: any) {
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

  protected start() {
    if (this.options.minimal) return

    log.info(
      `${chalk.gray(`(${this.status[0]}/${this.status[1]})`)} Applying ${
        this.name
      }...`
    )
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
        await execa('git', ['apply', '-R', ...PATCH_ARGS, this.src as any], {
          cwd: ENGINE_DIR,
        })
      } catch (e) {
        null
      }

      const { stdout, exitCode } = await execa(
        'git',
        ['apply', ...PATCH_ARGS, this.src as any],
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
