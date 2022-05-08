import { getPatchName } from './export-file'

describe('getPatchName', () => {
  it('works on root files', () => {
    const name = getPatchName('foo.js')
    expect(name).toBe('foo-js.patch')
  })

  it('works on embedded files', () => {
    const name = getPatchName('foo/bar.js')
    expect(name).toBe('bar-js.patch')
  })
})
