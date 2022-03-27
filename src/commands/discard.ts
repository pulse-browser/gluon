import execa from 'execa'
import { existsSync, statSync } from 'fs'
import { resolve } from 'path'
import { log } from '../log'
import { ENGINE_DIR } from '../constants'

interface Options {
  keep?: boolean
}

export const discard = async (
  file: string,
  options: Options
): Promise<void> => {
  const realFile = resolve(ENGINE_DIR, file)

  log.info(`Discarding ${file}...`)

  if (!existsSync(realFile)) throw new Error(`File ${file} does not exist`)
  if (!statSync(realFile).isFile()) throw new Error('Target must be a file.')

  try {
    await execa('git', ['restore', file], { cwd: ENGINE_DIR })
  } catch (e) {
    log.warning(`The file ${file} was not changed`)
  }
}
