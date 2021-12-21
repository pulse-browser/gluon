import { lstatSync, readdirSync } from 'fs'
import { sync } from 'glob'
import Listr from 'listr'
import { join, resolve } from 'path'
import { config } from '../..'
import { SRC_DIR } from '../../constants'
import { BRANDING_DIR, BrandingPatch } from '../../controllers/brandingPatch'
import { ManualPatch, PatchBase, PatchFile } from '../../controllers/patch'
import manualPatches from '../../manual-patches'

type ListrTaskGroup = {
  title: string
  task: () => Listr<any>
}

function patchMethod<T extends PatchBase>(
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
        }))
      ),
  }
}

function importMelonPatches(): ListrTaskGroup {
  const patches: PatchBase[] = []

  if (config.buildOptions.generateBranding) {
    for (const brandingStyle of readdirSync(BRANDING_DIR).filter((file) =>
      lstatSync(join(BRANDING_DIR, file)).isDirectory()
    )) {
      patches.push(new BrandingPatch(brandingStyle, false))
    }
  }

  return patchMethod(
    'melon',
    patches,
    async (patch, i) => await patch.applyWithStatus([i, patches.length])
  )
}

function importFolders(): ListrTaskGroup {
  return patchMethod(
    'folder',
    manualPatches.map(
      (patch, i) =>
        new ManualPatch(
          patch.name,
          [i, manualPatches.length],
          {},
          patch.action,
          patch.src
        )
    ),
    async (patch) => await patch.apply()
  )
}

function importGitPatch(): ListrTaskGroup {
  return patchMethod(
    'git',
    sync('**/*.patch').map(
      (file, i, array) =>
        new PatchFile(file, [i, array.length], {}, resolve(SRC_DIR, file))
    ),
    async (patch) => await patch.apply()
  )
}

export async function applyPatches(): Promise<void> {
  await new Listr([
    importMelonPatches(),
    importFolders(),
    importGitPatch(),
  ]).run()
}
