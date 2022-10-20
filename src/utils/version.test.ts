// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { validProducts } from './config'
import { getLatestFF } from './version'

const firefoxVersions = validProducts

describe('getLatestFF', () => {
  for (const firefoxVersion of firefoxVersions) {
    it(`returns the latest ${firefoxVersion} version`, async () =>
      expect(await getLatestFF(firefoxVersion)).toBeTruthy())
  }
})
