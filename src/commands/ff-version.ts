import { getConfig } from '../utils/config'

export const getFFVersion = (): void => {
  console.log(getConfig().version.version || 'Not Specified')
}
