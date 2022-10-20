// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
