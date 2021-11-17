import chalk from 'chalk'
import execa from 'execa'
import { existsSync, mkdirSync, rmdirSync } from 'fs'
import { ensureDirSync, removeSync } from 'fs-extra'
import fetch from 'node-fetch'
import ora from 'ora'
import { homedir } from 'os'
import { dirname, join, posix, resolve, sep } from 'path'
import { bin_name, config, log } from '..'
import { ENGINE_DIR } from '../constants'
import {
  getConfig,
  SupportedProducts,
  walkDirectory,
  writeMetadata,
} from '../utils'
import { downloadFileToLocation } from '../utils/download'
import { downloadArtifacts } from './download-artifacts'

const gFFVersion = getConfig().version.version

let initProgressText = 'Initialising...'
let initProgress: any = ora({
  text: `Initialising...`,
  prefixText: chalk.blueBright.bold('00:00:00'),
  spinner: {
    frames: [''],
  },
  indent: 0,
})

function getMozPlatformIdentifier() {
  let platform: NodeJS.Platform | string = process.platform

  if (platform == 'linux') {
    platform = 'linux64'
  }

  return platform
}

export const download = async () => {
  setInterval(() => {
    if (initProgress) {
      initProgress.text = initProgressText
      initProgress.prefixText = chalk.blueBright.bold(log.getDiff())
    }
  }, 100)

  const version = gFFVersion

  // If gFFVersion isn't specified, provide legible error
  if (!version) {
    log.error(
      'You have not specified a version of firefox in your config file. This is required to build a firefox fork'
    )
    process.exit(1)
  }

  // The location to download the firefox source code from the web
  const sourceFileName = await downloadFirefoxSource(version)

  const [artifactFileName, artifactID] = (await downloadArtifactBinary(
    version
  )) || [undefined, undefined]

  await unpackFirefoxSource(sourceFileName)

  if (process.platform === 'win32') {
    if (existsSync(resolve(homedir(), '.mozbuild'))) {
      log.info('Mozbuild directory already exists, not redownloading')
    } else {
      log.info('Mozbuild not found, downloading artifacts.')
      await downloadArtifacts()
    }
  }

  if (process.env.CI_SKIP_INIT) return log.info('Skipping initialisation.')

  const initProc = execa('npx', ['melon', 'ff-init', 'engine'])

  ;(initProc.stdout as any).on('data', (data: string) =>
    log.debug(data.toString())
  )
  ;(initProc.stdout as any).on('error', (data: string) => log.warning(data))

  initProc.on('exit', async () => {
    if (artifactFileName && artifactID) {
      await unpackArtifact(artifactFileName, artifactID)
    }

    log.success(
      `You should be ready to make changes to Dot Browser.\n\n\t   You should import the patches next, run |${bin_name} import|.\n\t   To begin building Dot, run |${bin_name} build|.`
    )
    console.log()

    await writeMetadata()

    let cwd = process.cwd().split(sep).join(posix.sep)

    if (process.platform == 'win32') {
      cwd = './'
    }

    removeSync(resolve(cwd, '.dotbuild', 'engines', sourceFileName))

    process.exit(0)
  })
}

const onData = (data: any) => {
  const d = data.toString()

  d.split('\n').forEach((line: any) => {
    if (line.trim().length !== 0) {
      const t = line.split(' ')
      t.shift()
      initProgressText = t.join(' ')
    }
  })
}

const unpackFirefoxSource = (name: string): Promise<void> => {
  return new Promise((res) => {
    let cwd = process.cwd().split(sep).join(posix.sep)

    if (process.platform == 'win32') {
      cwd = './'
    }

    initProgress.start()
    initProgressText = `Unpacking Firefox...`

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

    ;(tarProc.stdout as any).on('data', onData)
    ;(tarProc.stdout as any).on('error', onData)

    tarProc.on('exit', () => {
      initProgressText = ''
      initProgress.stop()
      initProgress = null

      res()
    })
  })
}
async function unpackArtifact(artifactFileName: string, artifactID: string) {
  log.info('Unpacking artifact...')

  await execa('tar', [
    '--transform',
    `s,${artifactID}/firefox,artifact-extracted,`,
    '-xf',
    resolve(process.cwd(), `.dotbuild`, `engines`, artifactFileName),
  ])

  log.info('Copying artifact...')

  const artifactRoot = join(process.cwd(), 'firefox')
  const items = await walkDirectory(artifactRoot)
  const mozDistDir = join(ENGINE_DIR, 'obj-x86_64-pc-linux-gnu', 'dist', 'bin')

  log.warning(
    'Artifact unpack is assuming linux, which may cause issues later...'
  )
  log.warning(
    'Please file an issue or pull request if you need this on another platform'
  )

  for (const item of items) {
    const dest = join(mozDistDir, item.replace(artifactRoot, ''))
    const destFolder = dirname(dest)

    log.debug(`Copying ${item} from artifact to ${dest}`)

    if (!existsSync(destFolder)) {
      mkdirSync(destFolder, { recursive: true })
    }

    if (!existsSync(dest)) {
      await execa('cp', [resolve('./firefox', item), dest])
    }
  }

  rmdirSync('./firefox', { recursive: true })

  log.success('Artifact unpacked successfully.')
}

async function downloadArtifactBinary(
  version: string
): Promise<[string, string] | undefined> {
  if (config.buildOptions.artifactBuilds) {
    if (config.version.product !== SupportedProducts.Firefox) {
      log.error(
        `'${config.version.product}' is not supported by the artifact build system currently. Either switch to firefox stable, disable artifact builds or submit a pull request to fix this...`
      )
      process.exit(-1)
    }

    const tag = `FIREFOX_${version.replace(/\./g, '_')}_RELEASE`

    log.info(`Retrieving information for the tag ${tag}`)

    const tagInfo = await (
      await fetch(`https://moz-release-api.vercel.app/api/release?tag=${tag}`)
    ).json()

    if (tagInfo == {}) {
      log.error(
        `There doesn't appear to be any info for the tag '${tag}'. The release may not exist`
      )
      process.exit(-1)
    }

    const { treeherder } = tagInfo
    const [repo, revision] = treeherder.split(' ')[0].split('@')

    const pushList = await (
      await fetch(
        `https://treeherder.mozilla.org/api/project/${repo}/push/?full=true&count=1&revision=${revision}`
      )
    ).json()

    const [pushInfo] = pushList.results

    const { results } = await (
      await fetch(
        `https://treeherder.mozilla.org/api/jobs/?push_id=${pushInfo.id}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (X11; Linux x86_64; rv:94.0) Gecko/20100101 Firefox/94.0',
            Accept: '*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            Pragma: 'no-cache',
            'Cache-Control': 'no-cache',
          },
          method: 'GET',
        }
      )
    ).json()

    const possibleBinaries = results.filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_1, _2, _3, _4, _5, jobLetter]: (string | number)[]) =>
        jobLetter === 'B'
    )

    const target = `build-${getMozPlatformIdentifier()}/debug`

    const targetInfo = (possibleBinaries as (string | number)[][]).find(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_1, _2, _3, _4, targetId]) => targetId === target
    )

    if (!targetInfo) {
      log.error("There doesn't appear to be a target for " + target)
      process.exit(1)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, runID] =
      targetInfo

    const primaryDownload = `https://firefox-ci-tc.services.mozilla.com/api/queue/v1/task/${runID}/runs/0/artifacts/public%2Fbuild%2Ftarget.tar.bz2`
    const artifactFileName = `${runID}-target.tar.bz2`

    log.info(`Downloading artifact ${runID}...`)

    await downloadFileToLocation(
      primaryDownload,
      resolve(process.cwd(), `.dotbuild`, `engines`, artifactFileName)
    )

    return [artifactFileName, `${runID}-target`]
  }
}

async function downloadFirefoxSource(version: string) {
  const base = `https://archive.mozilla.org/pub/firefox/releases/${version}/source/`
  const filename = `firefox-${version}.source.tar.xz`

  const url = base + filename

  log.info(`Locating Firefox release ${version}...`)

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
    log.warning(
      'Version includes non-numeric characters. This is probably a beta.'
    )

  // Do not re-download if there is already an existing workspace present
  if (existsSync(ENGINE_DIR)) {
    log.error(
      `Workspace already exists.\nRemove that workspace and run |${bin_name} download ${version}| again.`
    )
  }

  log.info(`Downloading Firefox release ${version}...`)

  await downloadFileToLocation(
    url,
    resolve(process.cwd(), `.dotbuild`, `engines`, filename)
  )
  return filename
}
