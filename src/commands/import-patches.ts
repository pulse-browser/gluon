import { writeFileSync } from 'fs'
import { sync } from 'glob'
import { resolve } from 'path'
import { log } from '..'
import { SRC_DIR } from '../constants'
import { ManualPatch, PatchFile } from '../controllers/patch'
import manualPatches from '../manual-patches'
import { patchCountFile } from '../middleware/patch-check'
import { delay, walkDirectory } from '../utils'

const importManual = async (minimal?: boolean, noIgnore?: boolean) => {
  log.info(`Applying ${manualPatches.length} manual patches...`)

  if (!minimal) console.log()

  return new Promise(async (res, rej) => {
    var total = 0

    var i = 0

    for await (let { name, action, src } of manualPatches) {
      ++i

      const patch = new ManualPatch(
        name,
        [i, manualPatches.length],
        { minimal, noIgnore },
        action,
        src
      )

      await delay(10)

      await patch.apply()
    }

    log.success(`Successfully imported ${manualPatches.length} manual patches!`)
    console.log()

    log.info('Storing patch count...')

    const fileList = await walkDirectory(resolve(process.cwd(), 'src'))
    const fileCount = fileList.length

    writeFileSync(patchCountFile, fileCount.toString())

    res(total)
  })
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

  await delay(500)

  var i = 0

  for await (const patchName of patches) {
    ++i

    const patch = new PatchFile(
      patchName,
      [i, patches.length],
      { minimal, noIgnore },
      resolve(SRC_DIR, patchName)
    )

    await delay(10)

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

interface Args {
  minimal?: boolean
  noignore?: boolean
}

export const importPatches = async (type: string, args: Args) => {
  if (type) {
    if (type == 'manual') await importManual(args.minimal)
    else if (type == 'file') await importPatchFiles(args.minimal)
  } else {
    await importManual(args.minimal, args.noignore)
    await importPatchFiles(args.minimal, args.noignore)
  }
}
