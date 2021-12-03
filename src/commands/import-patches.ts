import { lstatSync, readdirSync, writeFileSync } from 'fs'
import { sync } from 'glob'
import { join, resolve } from 'path'
import { config, log } from '..'
import { SRC_DIR } from '../constants'
import { BrandingPatch, BRANDING_DIR } from '../controllers/brandingPatch'
import { ManualPatch, PatchBase, PatchFile } from '../controllers/patch'
import manualPatches from '../manual-patches'
import { patchCountFile } from '../middleware/patch-check'
import { walkDirectory } from '../utils'

function enumerate<T>(array: T[]): [T, number][] {
  return array.map<[T, number]>((item, i) => [item, i])
}

const importManual = async (minimal?: boolean, noIgnore?: boolean) => {
  log.info(`Applying ${manualPatches.length} manual patches...`)

  if (!minimal) console.log()

  for await (const [{ name, action, src }, i] of enumerate(manualPatches)) {
    const patch = new ManualPatch(
      name,
      [i, manualPatches.length],
      { minimal, noIgnore },
      action,
      src
    )

    await patch.apply()
  }

  log.success(`Successfully imported ${manualPatches.length} manual patches!`)
  console.log()

  log.info('Storing patch count...')

  const fileList = await walkDirectory(resolve(process.cwd(), 'src'))
  const fileCount = fileList.length

  writeFileSync(patchCountFile, fileCount.toString())
}

const importPatchFiles = async (minimal?: boolean, noIgnore?: boolean) => {
  let patches = sync('**/*.patch', {
    nodir: true,
    cwd: SRC_DIR,
  })

  patches = patches
    .filter((p) => p !== '.index')
    .filter((p) => !p.includes('node_modules'))

  log.info(`Applying ${patches.length} patch files...`)

  if (!minimal) console.log()

  for await (const [patchName, i] of enumerate(patches)) {
    const patch = new PatchFile(
      patchName,
      [i, patches.length],
      { minimal, noIgnore },
      resolve(SRC_DIR, patchName)
    )

    await patch.apply()
  }

  console.log()
  // TODO: Setup a custom patch doctor
  // await dispatch(
  //   `./${bin_name}`,
  //   ['doctor', 'patches'],
  //   process.cwd(),
  //   true,
  //   true
  // )

  log.success(`Successfully imported ${patches.length} patch files!`)
}

const importMelonPatches = async (minimal?: boolean) => {
  const patches: PatchBase[] = []

  log.info(`Applying ${patches.length} melon patches...`)

  if (config.buildOptions.generateBranding) {
    for (const brandingStyle of readdirSync(BRANDING_DIR).filter((file) =>
      lstatSync(join(BRANDING_DIR, file)).isDirectory()
    )) {
      console.log(brandingStyle)
      patches.push(new BrandingPatch(brandingStyle, minimal))
    }
  }

  if (!minimal) console.log()

  for await (const [patch, i] of enumerate(patches)) {
    await patch.applyWithStatus([i, patches.length])
  }

  console.log()

  log.success(`Successfully imported ${patches.length} melon patches!`)
}

interface Args {
  minimal?: boolean
  noignore?: boolean
}

export const importPatches = async (
  type: string,
  args: Args
): Promise<void> => {
  if (type) {
    if (type == 'manual') await importManual(args.minimal)
    else if (type == 'file') await importPatchFiles(args.minimal)
  } else {
    await importMelonPatches(args.minimal)
    await importManual(args.minimal, args.noignore)
    await importPatchFiles(args.minimal, args.noignore)
  }
}
