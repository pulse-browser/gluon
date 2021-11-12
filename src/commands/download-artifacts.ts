import execa from 'execa'
import { homedir } from 'os'
import { posix, resolve, sep } from 'path'
import { log } from '..'
import { downloadFileToLocation } from '../utils/download'

export const downloadArtifacts = async (): Promise<void> => {
  if (process.platform !== 'win32')
    return log.error(
      'This is not a Windows machine, will not download artifacts.'
    )
  if (process.env.MOZILLABUILD)
    return log.error(
      'Run this command in Git Bash, it does not work in Mozilla Build.'
    )

  const filename = 'mozbuild.tar.bz2'
  const url = `https://github.com/dothq/windows-artifacts/releases/latest/download/mozbuild.tar.bz2`
  let home = homedir().split(sep).join(posix.sep)

  if (process.platform == 'win32') {
    home = `/${home.replace(/\:/, '').replace(/\\/g, '/').toLowerCase()}`
  }

  log.info(`Downloading Windows artifacts...`)

  await downloadFileToLocation(url, resolve(process.cwd(), filename))

  log.info('Unpacking mozbuild...')

  await execa('tar', ['-xvf', filename, '-C', home])

  log.info('Done extracting mozbuild artifacts.')
}
