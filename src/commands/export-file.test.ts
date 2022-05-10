// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
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
