import * as config from '../utils/config'
import { getFFVersion } from './ff-version'

describe('getFFVersion', () => {
  it('Returns not specified with an empty config', () => {
    const log = jest.spyOn(console, 'log')
    config.setMockRawConfig('{}')

    getFFVersion()

    expect(log).toBeCalled()
    expect(log).toBeCalledWith('Not Specified')

    log.mockRestore()
  })

  it('Returns the version from the config', () => {
    const log = jest.spyOn(console, 'log')
    config.setMockRawConfig(
      `{"version": { "version": "1.2.3", "product": "firefox" }}`
    )

    getFFVersion()

    expect(log).toBeCalled()
    expect(log).toBeCalledWith('1.2.3')

    log.mockRestore()
  })
})
