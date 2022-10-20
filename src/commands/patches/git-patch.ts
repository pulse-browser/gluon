// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import execa from 'execa'
import { PATCH_ARGS, ENGINE_DIR } from '../../constants'
import { log } from '../../log'
import { IMelonPatch } from './command'

export interface IGitPatch extends IMelonPatch {
  path: string
}

export async function apply(path: string): Promise<void> {
  try {
    await execa('git', ['apply', '-R', ...PATCH_ARGS, path], {
      cwd: ENGINE_DIR,
    })
  } catch {
    // If the patch has already been applied, we want to revert it. Because
    // there is no good way to check this we are just going to catch and
    // discard the error
    undefined
  }

  const { stdout, exitCode } = await execa(
    'git',
    ['apply', ...PATCH_ARGS, path],
    { cwd: ENGINE_DIR }
  )

  if (exitCode != 0) log.error(stdout)
}
