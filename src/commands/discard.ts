import execa from 'execa'
import { existsSync, statSync } from 'fs'
import { resolve } from 'path'
import rimraf from 'rimraf'
import { log } from '..'
import { ENGINE_DIR, PATCHES_DIR } from '../constants'

interface Options {
  keep?: boolean
}

export const discard = async (
  file: string,
  options: Options
): Promise<void> => {
  log.info(`Discarding ${file}...`)

  if (!statSync(file).isFile()) throw new Error('Target must be a file.')

  if (!existsSync(resolve(ENGINE_DIR, file)))
    throw new Error(
      `File ${file} could not be found in src directory. Check the path for any mistakes and try again.`
    )

  const patchFile = resolve(
    PATCHES_DIR,
    `${file.replace(/\//g, '-').replace(/\./g, '-')}.patch`
  )

  if (!existsSync(patchFile))
    throw new Error(
      `File ${file} does have an associated patch in the patches directory.`
    )

  const { stdout, exitCode } = await execa(
    'git',
    ['apply', '-R', '-p', '1', patchFile],
    { cwd: ENGINE_DIR }
  )

  if (exitCode == 0) {
    log.success(`Discarded changes to ${file}.`)
    if (!options.keep) rimraf.sync(patchFile)
  } else throw new Error(stdout)
}
