import execa from 'execa'
import { existsSync, rmdirSync, rmSync, statSync } from 'fs'
import { resolve } from 'path'
import { log } from '..'
import { discard } from '../commands'
import { ENGINE_DIR, PATCH_ARGS } from '../constants'
import { copyManual } from '../utils'

export abstract class PatchBase {
  public name: string

  constructor(name: string) {
    this.name = name
  }

  protected filesExist(files: string[]): boolean {
    return files.every((file) => existsSync(file))
  }

  abstract apply(): Promise<void>
}

export class ManualPatch extends PatchBase {
  private action: 'copy' | 'delete'

  private src: string | string[]

  constructor(name: string, action: 'copy' | 'delete', src: string | string[]) {
    super(name)

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
    switch (this.action) {
      case 'copy':
        if (typeof this.src === 'string') {
          await copyManual(this.src)
        } else if (Array.isArray(this.src)) {
          for (const item of this.src) {
            await copyManual(item)
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
  }
}

export class PatchFile extends PatchBase {
  private src: string

  constructor(name: string, src: string) {
    super(name)
    this.src = src
  }

  async apply(): Promise<void> {
    try {
      await execa('git', ['apply', '-R', ...PATCH_ARGS, this.src], {
        cwd: ENGINE_DIR,
      })
    } catch (_e) {
      // If the patch has already been applied, we want to revert it. Because
      // there is no good way to check this we are just going to catch and
      // discard the error
      null
    }

    const { stdout, exitCode } = await execa(
      'git',
      ['apply', ...PATCH_ARGS, this.src],
      { cwd: ENGINE_DIR }
    )

    if (exitCode != 0) throw stdout
  }
}
