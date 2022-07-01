import { config } from '..'
import { log } from '../log'
import { dynamicConfig } from '../utils'

export const set = (key: string, value?: string) => {
  if (key == 'version') {
    console.log(
      config.brands[dynamicConfig.get('brand')].release.displayVersion
    )
    return
  }

  if (!(key in dynamicConfig.defaultValues)) {
    log.warning(`The key ${key} is not found within the dynamic config options`)
    return
  }

  if (value) {
    dynamicConfig.set(key as dynamicConfig.DefaultValuesKeys, value)
    log.info(`Set ${key} to ${value}`)
    return
  }

  console.log(dynamicConfig.get(key as dynamicConfig.DefaultValuesKeys))
}
