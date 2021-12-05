import { Command } from 'commander'
import { existsSync, readFileSync } from 'fs'
import Listr from 'listr'
import { resolve } from 'path'
import { bin_name, log } from '..'
import { dispatch } from '../utils'

export const init = async (
  directory: Command | string,
  task?: Listr.ListrTaskWrapper<any>
): Promise<void> => {
  function logInfo(data: string) {
    if (task) {
      task.output = data
    } else {
      log.info(data)
    }
  }

  const cwd = process.cwd()

  const dir = resolve(cwd as string, directory.toString())

  if (!existsSync(dir)) {
    log.error(
      `Directory "${directory}" not found.\nCheck the directory exists and run |${bin_name} init| again.`
    )
  }

  let version = readFileSync(
    resolve(
      cwd,
      directory.toString(),
      'browser',
      'config',
      'version_display.txt'
    ),
    'utf-8'
  )

  if (!version)
    log.error(
      `Directory "${directory}" not found.\nCheck the directory exists and run |${bin_name} init| again.`
    )

  version = version.trim().replace(/\\n/g, '')

  logInfo('Initializing git, this may take some time')
  await dispatch('git', ['init'], dir as string, false, logInfo)
  await dispatch(
    'git',
    ['checkout', '--orphan', version],
    dir as string,
    false,
    logInfo
  )
  await dispatch('git', ['add', '-f', '.'], dir as string, false, logInfo)
  await dispatch(
    'git',
    ['commit', '-am', `"Firefox ${version}"`],
    dir as string,
    false,
    logInfo
  )
  await dispatch(
    'git',
    ['checkout', '-b', 'dot'],
    dir as string,
    false,
    logInfo
  )
}
