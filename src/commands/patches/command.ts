// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { sync } from 'glob'
import Listr from 'listr'
import { ENGINE_DIR, SRC_DIR } from '../../constants'

import * as gitPatch from './gitPatch'
import * as copyPatch from './copyPatches'
import * as brandingPatch from './brandingPatch'
import { join } from 'path'
import { existsSync, writeFileSync } from 'fs'
import { patchCountFile } from '../../middleware/patch-check'
import { checkHash } from '../../utils'
import { log } from '../../log'
import { templateDir } from '../setupProject'

type ListrTaskGroup = Listr.ListrTask<unknown>

export interface IMelonPatch {
  name: string
  skip?: (
    ctx: unknown
  ) => string | boolean | void | Promise<string | boolean | undefined>
}

function patchMethod<T extends IMelonPatch>(
  name: string,
  patches: T[],
  patchFn: (patch: T, index: number) => Promise<void>
): ListrTaskGroup {
  return {
    title: `Apply ${patches.length} ${name} patches`,
    task: () =>
      new Listr(
        patches.map((patch, index) => ({
          title: `Apply ${patch.name}`,
          task: () => patchFn(patch, index),
          skip: patch.skip,
        }))
      ),
  }
}

function importMelonPatches(): ListrTaskGroup {
  return patchMethod(
    'branding',
    [
      ...(brandingPatch.get().map((name) => ({
        type: 'branding',
        name,
        value: name,
        skip: async () => {
          const logoCheck = checkHash(
            join(brandingPatch.BRANDING_DIR, name, 'logo.png')
          )
          const macosInstallerCheck = checkHash(
            join(brandingPatch.BRANDING_DIR, name, 'MacOSInstaller.svg')
          )

          if (
            (await logoCheck) &&
            (await macosInstallerCheck) &&
            existsSync(join(ENGINE_DIR, 'browser/branding', name))
          ) {
            return `${name} has already been applied`
          }

          return
        },
      })) as brandingPatch.IBrandingPatch[]),
    ],
    async (patch) => await brandingPatch.apply(patch.value as string)
  )
}

function importFolders(): ListrTaskGroup {
  return patchMethod(
    'folder',
    copyPatch.get(),
    async (patch) => await copyPatch.apply(patch.src)
  )
}

function importGitPatch(): ListrTaskGroup {
  const patches = sync('**/*.patch', { nodir: true, cwd: SRC_DIR }).map(
    (path) => join(SRC_DIR, path)
  )

  writeFileSync(patchCountFile, patches.length.toString())

  return patchMethod<gitPatch.IGitPatch>(
    'git',
    patches.map((path) => ({ name: path, path })),
    async (patch) => await gitPatch.apply(patch.path)
  )
}

function importInternalPatch(): ListrTaskGroup {
  const patches = sync('*.patch', {
    nodir: true,
    cwd: join(templateDir, 'patches.optional'),
  }).map((path) => ({
    name: path,
    path: join(templateDir, 'patches.optional', path),
  }))

  return patchMethod<gitPatch.IGitPatch>(
    'gluon',
    patches,
    async (patch) => await gitPatch.apply(patch.path)
  )
}

export async function applyPatches(): Promise<void> {
  await new Listr(
    [
      importInternalPatch(),
      importMelonPatches(),
      importFolders(),
      importGitPatch(),
    ],
    {
      renderer: log.isDebug ? 'verbose' : 'default',
    }
  ).run()
}
