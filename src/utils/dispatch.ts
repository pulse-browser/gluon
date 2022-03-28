// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import execa from 'execa'
import { log } from '../log'

export const removeTimestamp = (input: string): string =>
  input.replace(/\s\d{1,5}:\d\d\.\d\d /g, '')

export const dispatch = (
  cmd: string,
  args?: string[],
  cwd?: string,
  killOnError?: boolean,
  logger = (data: string) => log.info(data)
): Promise<boolean> => {
  log.debug(`Running dispatch with args; command: ${cmd}, args: ${args}, cwd: ${cwd}, killOnError: ${killOnError}`)
  
  const handle = (data: string | Error, killOnError?: boolean) => {
    const d = data.toString()

    d.split('\n').forEach((line: string) => {
      if (line.length !== 0) logger(removeTimestamp(line))
    })

    if (killOnError) {
      log.error('Command failed. See error above.')
    }
  }

  return new Promise((resolve) => {
    process.env.MACH_USE_SYSTEM_PYTHON = 'true'

    const proc = execa(cmd, args, {
      cwd: cwd || process.cwd(),
      env: process.env,
    })

    proc.stdout?.on('data', (d) => handle(d))
    proc.stderr?.on('data', (d) => handle(d))

    proc.stdout?.on('error', (d) => handle(d, killOnError))
    proc.stderr?.on('error', (d) => handle(d, killOnError))

    proc.on('exit', () => {
      resolve(true)
    })
  })
}
