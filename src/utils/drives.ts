import { spawn } from 'child_process'
import execa from 'execa'
import { log } from '../log'

// ['c:', 'd:']
export function listDrives(): string[] {
  if (process.platform !== 'win32') {
    log.warning('listDrives() does not work on non-windows platforms :(')
    log.askForReport()

    process.exit(1)
  }

  const data = execa.commandSync('wmic logicaldisk get name').stdout

  const output = String(data)
  const out = output
    .split('\r\n')
    .map((e) => e.trim())
    .filter((e) => e != '')
  if (out[0] === 'Name') {
    return out.slice(1)
  }

  return []
}
