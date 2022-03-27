import { existsSync } from 'fs'
import { copyFile, mkdir, readdir, rmdir, stat, unlink } from 'fs/promises'
import { join, resolve } from 'path'
import { bin_name, config, log } from '..'
import { DIST_DIR, ENGINE_DIR, OBJ_DIR } from '../constants'
import { dispatch } from '../utils'

const machPath = resolve(ENGINE_DIR, 'mach')

export const melonPackage = async () => {
  // The engine directory must have been downloaded for this to be valid
  // TODO: Make this a reusable function that can be used by everything
  if (!existsSync(ENGINE_DIR)) {
    log.error(
      `Unable to locate any source directories.\nRun |${bin_name} download| to generate the source directory.`
    )
  }

  if (!existsSync(machPath)) {
    log.error(`Cannot locate the 'mach' binary within ${ENGINE_DIR}`)
  }

  const args = ['package']

  log.info(
    `Packaging \`${config.binaryName}\` with args ${JSON.stringify(
      args.slice(1, 0)
    )}...`
  )

  await dispatch(machPath, args, ENGINE_DIR, true)

  log.info('Copying results up')

  log.debug("Creating the dist directory if it doesn't exist")
  if (!existsSync(DIST_DIR)) await mkdir(DIST_DIR, { recursive: true })

  log.debug('Indexing files to copy')
  const files = (await readdir(join(OBJ_DIR, 'dist'), { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)

  for (const file of files) {
    const destFile = join(DIST_DIR, file)
    log.debug(`Copying ${file}`)
    if (existsSync(destFile)) await unlink(destFile)
    await copyFile(join(OBJ_DIR, 'dist', file), destFile)
  }

  log.info()
  log.info(`Output written to ${DIST_DIR}`)

  log.success('Packaging complected!')
}
