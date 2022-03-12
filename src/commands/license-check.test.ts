import { isValidLicense } from './license-check'

describe('isValidLicense', () => {
  it('Returns true if the file contains a valid license', async () => {
    expect(await isValidLicense('./license-check.test.ts')).toBe(true)
  })

  it('Returns false if the file contains an invalid license header', async () => {
    expect(await isValidLicense('./tests/invalid-license.txt')).toBe(false)
  })
})
