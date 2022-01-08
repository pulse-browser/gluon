import { sync } from 'glob'
import Listr from 'listr'
import { SRC_DIR } from '../../constants'

import * as gitPatch from './gitPatch'
import * as copyPatch from './copyPatches'
import * as brandingPatch from './brandingPatch'
import { join } from 'path'
import { writeFileSync } from 'fs'
import { patchCountFile } from '../../middleware/patch-check'

type ListrTaskGroup = {
  title: string
  task: () => Listr<any>
}

function patchMethod<T>(
  name: string,
  patches: T[],
  nameFn: (patch: T) => string,
  patchFn: (patch: T, index: number) => Promise<void>
): ListrTaskGroup {
  return {
    title: `Apply ${patches.length} ${name} patches`,
    task: () =>
      new Listr(
        patches.map((patch, index) => ({
          title: `Apply ${nameFn(patch)}`,
          task: () => patchFn(patch, index),
        }))
      ),
  }
}

interface IMelonPatch {
  type: 'branding'
  name: string
  value: unknown
}

function importMelonPatches(): ListrTaskGroup {
  return patchMethod(
    'melon',
    [
      ...(brandingPatch.get().map((name) => ({
        type: 'branding',
        name,
        value: name,
      })) as IMelonPatch[]),
    ],
    (patch) => patch.name,
    async (patch) => await brandingPatch.apply(patch.value as string)
  )
}

function importFolders(): ListrTaskGroup {
  return patchMethod(
    'folder',
    copyPatch.get(),
    (patch) => patch.name,
    async (patch) => await copyPatch.apply(patch.src)
  )
}

function importGitPatch(): ListrTaskGroup {
  const patches = sync('**/*.patch', { nodir: true, cwd: SRC_DIR }).map(
    (path) => join(SRC_DIR, path)
  )

  writeFileSync(patchCountFile, patches.length.toString())

  return patchMethod(
    'git',
    patches,
    (path) => path,
    async (path) => await gitPatch.apply(path)
  )
}

export async function applyPatches(): Promise<void> {
  await new Listr([
    importMelonPatches(),
    importFolders(),
    importGitPatch(),
  ]).run()
}
