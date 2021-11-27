import { existsSync, rmdirSync } from 'fs'
import { homedir } from 'os'
import { posix, resolve, sep } from 'path'

import execa from 'execa'
import { ensureDirSync, removeSync } from 'fs-extra'
import Listr from 'listr'

import { bin_name, log } from '..'
import { ENGINE_DIR } from '../constants'
import { getConfig, writeMetadata } from '../utils'
import { downloadFileToLocation } from '../utils/download'
import { downloadArtifacts } from './download-artifacts'

const gFFVersion = getConfig().version.version

export const download = async (): Promise<void> => {
  const version = gFFVersion

  // If gFFVersion isn't specified, provide legible error
  if (!version) {
    log.error(
      'You have not specified a version of firefox in your config file. This is required to build a firefox fork'
    )
    process.exit(1)
  }

  await new Listr([
    {
      title: 'Downloading firefox source',
      skip: () => {
        if (existsSync(ENGINE_DIR)) {
          return 'Firefox has already been downloaded, unpacked and inited'
        }
      },
      task: async (ctx, task) => {
        ctx.firefoxSourceTar = await downloadFirefoxSource(version, task)
      },
    },
    {
      title: 'Unpack firefox source',
      enabled: (ctx) => ctx.firefoxSourceTar,
      task: async (ctx, task) => {
        await unpackFirefoxSource(ctx.firefoxSourceTar, task)
      },
    },
    {
      title: 'Install windows artifacts',
      enabled: (ctx) => process.platform == 'win32',
      task: async (ctx) => {
        if (existsSync(resolve(homedir(), '.mozbuild'))) {
          log.info('Mozbuild directory already exists, not redownloading')
        } else {
          log.info('Mozbuild not found, downloading artifacts.')
          await downloadArtifacts()
        }
      },
    },
    {
      title: 'Init firefox',
      enabled: (ctx) => ctx.firefoxSourceTar && !process.env.CI_SKIP_INIT,
      // TODO: Call init as a function rather than using npx
      task: async (_ctx, task) => {
        const initProc = execa('npx', ['melon', 'ff-init', 'engine'])
        initProc.stdout?.on('data', (data: string) => (task.output = data))
      },
    },
    {
      title: 'Write metadata',
      task: async () => {
        writeMetadata()
      },
    },
    {
      title: 'Cleanup',
      task: () => {
        let cwd = process.cwd().split(sep).join(posix.sep)

        if (process.platform == 'win32') {
          cwd = './'
        }

        removeSync(resolve(cwd, '.dotbuild', 'engines', sourceFileName))
      },
    },
  ]).run()

  log.success(
    `You should be ready to make changes to Dot Browser.\n\n\t   You should import the patches next, run |${bin_name} import|.\n\t   To begin building Dot, run |${bin_name} build|.`
  )
  console.log()
}

const unpackFirefoxSource = (
  name: string,
  task: Listr.ListrTaskWrapper<any>
): Promise<void> => {
  const onData = (data: any) => {
    const d = data.toString()

    d.split('\n').forEach((line: any) => {
      if (line.trim().length !== 0) {
        const t = line.split(' ')
        t.shift()
        task.output = t.join(' ')
      }
    })
  }

  return new Promise((res) => {
    let cwd = process.cwd().split(sep).join(posix.sep)

    if (process.platform == 'win32') {
      cwd = './'
    }

    task.output = `Unpacking Firefox...`

    try {
      rmdirSync(ENGINE_DIR)
    } catch (e) {}
    ensureDirSync(ENGINE_DIR)

    const tarProc = execa('tar', [
      '--transform',
      `s,firefox-${gFFVersion},engine,`,
      `--show-transformed`,
      '-xf',
      resolve(cwd, '.dotbuild', 'engines', name),
    ])

    tarProc.stdout?.on('data', onData)
    tarProc.stdout?.on('error', onData)

    tarProc.on('exit', () => {
      task.output = ''
      res()
    })
  })
}

async function downloadFirefoxSource(
  version: string,
  task: Listr.ListrTaskWrapper<any>
) {
  const base = `https://archive.mozilla.org/pub/firefox/releases/${version}/source/`
  const filename = `firefox-${version}.source.tar.xz`

  const url = base + filename

  task.output = `Locating Firefox release ${version}...`

  ensureDirSync(resolve(process.cwd(), `.dotbuild`, `engines`))

  if (
    existsSync(
      resolve(
        process.cwd(),
        `.dotbuild`,
        `engines`,
        `firefox-${version.split('b')[0]}`
      )
    )
  ) {
    log.error(
      `Cannot download version ${
        version.split('b')[0]
      } as it already exists at "${resolve(
        process.cwd(),
        `firefox-${version.split('b')[0]}`
      )}"`
    )
  }

  if (version.includes('b'))
    task.output =
      'WARNING Version includes non-numeric characters. This is probably a beta.'

  // Do not re-download if there is already an existing workspace present
  if (existsSync(ENGINE_DIR)) {
    log.error(
      `Workspace already exists.\nRemove that workspace and run |${bin_name} download ${version}| again.`
    )
  }

  task.output = `Downloading Firefox release ${version}...`

  await downloadFileToLocation(
    url,
    resolve(process.cwd(), `.dotbuild`, `engines`, filename)
  )
  return filename
}
