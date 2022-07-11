// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Command } from 'commander'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { bin_name } from '..'
import { log } from '../log'
import { config, configDispatch } from '../utils'

export const init = async (directory: Command | string): Promise<void> => {
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
    )
  ).toString()

  if (!version)
    log.error(
      `Directory "${directory}" not found.\nCheck the directory exists and run |${bin_name} init| again.`
    )

  version = version.trim().replace(/\\n/g, '')

  // TODO: Use bash on windows, this may significantly improve performance. Still needs testing though
  log.info('Initializing git, this may take some time')

  await configDispatch('git', {
    args: ['init'],
    cwd: dir,
    shell: 'unix',
  })

  await configDispatch('git', {
    args: ['init'],
    cwd: dir,
    shell: 'unix',
  })

  await configDispatch('git', {
    args: ['checkout', '--orphan', version],
    cwd: dir,
    shell: 'unix',
  })

  await configDispatch('git', {
    args: ['add', '-f', '.'],
    cwd: dir,
    shell: 'unix',
  })

  log.info('Committing...')

  await configDispatch('git', {
    args: ['commit', '-aqm', `"Firefox ${version}"`],
    cwd: dir,
    shell: 'unix',
  })

  await configDispatch('git', {
    args: ['checkout', '-b', config.name.toLowerCase().replace(/\s/g, '_')],
    cwd: dir,
    shell: 'unix',
  })
}
