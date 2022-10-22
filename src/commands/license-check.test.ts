// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { join } from 'node:path'
import { isValidLicense } from './license-check'

describe('isValidLicense', () => {
  it('Returns true if the file contains a valid license', async () => {
    expect(await isValidLicense(join(__dirname, 'license-check.test.ts'))).toBe(
      true
    )
  })

  it('Returns false if the file contains an invalid license header', async () => {
    expect(
      await isValidLicense(
        join(__dirname, '../../tests/assets/invalid-license.txt')
      )
    ).toBe(false)
  })
})
