import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { MELON_DIR } from '../constants'

/**
 * Stores the name of the current command on the file system to be accessed if
 * the command crashes to provide more helpful error reporting
 *
 * @param command The name of the command about to be run
 */
export function registerCommand(command: string): void {
  writeFileSync(resolve(MELON_DIR, 'command'), command)
}
