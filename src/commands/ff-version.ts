import { config } from '..'

export const getFFVersion = (): void => {
  console.log(config.version.version)
}
