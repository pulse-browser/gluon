import execa from 'execa'
import prompts from 'prompts'

import { bin_name } from '..'
import { ENGINE_DIR } from '../constants'
import { log } from '../log'

export const reset = async (): Promise<void> => {
  log.warning(`This will remove any changes that you have made to firefox`)
  log.warning(
    `If you have made changes to firefox's internal files, save them with |${bin_name} export [filename]|`
  )
  log.warning(
    `You will need to run |${bin_name} import| to bring back your saved changes`
  )

  const { answer } = await prompts({
    type: 'confirm',
    name: 'answer',
    message: 'Are you sure you want to continue?',
  })

  if (answer) {
    log.info('Unstaging changes...')
    await execa('git', ['reset'], { cwd: ENGINE_DIR })

    log.info('Reverting uncommitted changes...')
    await execa('git', ['checkout', '.'], { cwd: ENGINE_DIR })

    log.info('Removing all untracked files...')
    await execa('git', ['clean', '-fdx'], { cwd: ENGINE_DIR })
  }
}
