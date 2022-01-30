import execa from 'execa'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { log } from '..'
import { BIN_NAME } from '../constants'

const blacklistedCommands = ['reset', 'init', 'set-branch']

export const shaCheck = async (command: string): Promise<void> => {
  if (
    blacklistedCommands.filter((c) => command.startsWith(c)).length !== 0 ||
    !existsSync(resolve(process.cwd(), '.dotbuild', 'metadata'))
  )
    return

  const metadata = JSON.parse(
    readFileSync(resolve(process.cwd(), '.dotbuild', 'metadata'), 'utf-8')
  )

  const { stdout: currentBranch } = await execa('git', [
    'branch',
    '--show-current',
  ])

  if (metadata && metadata.branch) {
    if (metadata.branch !== currentBranch) {
      log.warning(`The current branch \`${currentBranch}\` differs from the original branch \`${metadata.branch}\`.
            
\t If you are changing the Firefox version, you will need to reset the tree
\t with |${BIN_NAME} reset --hard| and then |${BIN_NAME} download|.

\t Or you can change the default branch by typing |${BIN_NAME} set-branch <branch>|.`)
    }
  }
}
