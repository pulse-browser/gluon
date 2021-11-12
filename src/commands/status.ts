import { existsSync } from 'fs'
import { log } from '..'
import { ENGINE_DIR } from '../constants'
import { dispatch, hasConfig } from '../utils'

export const status = async (): Promise<void> => {
  const configExists = hasConfig()
  const engineExists = existsSync(ENGINE_DIR)

  if (!configExists && !engineExists) {
    log.info(
      "Melon doesn't appear to be setup for this project. You can set it up by running |melon setup-project|"
    )

    return
  }

  if (engineExists) {
    log.info("The following changes have been made to firefox's source code")
    await dispatch('git', ['diff'], ENGINE_DIR, true)

    return
  } else {
    log.info(
      "It appears that melon has been configured, but you haven't run |melon download|"
    )

    return
  }
}
