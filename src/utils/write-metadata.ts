import execa from 'execa'
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { config } from '..'

export const writeMetadata = async (): Promise<void> => {
  const { stdout: sha } = await execa('git', ['rev-parse', 'HEAD'])
  const { stdout: branch } = await execa('git', ['branch', '--show-current'])

  writeFileSync(
    resolve(process.cwd(), '.dotbuild', 'metadata'),
    JSON.stringify({
      sha,
      branch,
      birth: Date.now(),
      versions: config.version,
    })
  )
}
