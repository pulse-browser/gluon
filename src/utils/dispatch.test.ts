// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { removeTimestamp } from './dispatch'

describe('removeTimestamp', () => {
  it('removes "   0:00.00"', () =>
    expect(removeTimestamp('   0:00.00 This is a test')).toMatch(
      'This is a test'
    ))

  it('removes "   5:05.05"', () =>
    expect(removeTimestamp('   5:05.05 This is a test')).toMatch(
      'This is a test'
    ))

  it('removes "  10:10.10"', () =>
    expect(removeTimestamp('  10:10.10 This is a test')).toMatch(
      'This is a test'
    ))

  it('removes "\t10:41.76"', () =>
    expect(removeTimestamp('\t10:41.76 This is a test')).toMatch(
      'This is a test'
    ))

  it('removes "  50:50.50"', () =>
    expect(removeTimestamp('  50:50.50 This is a test')).toMatch(
      'This is a test'
    ))
})
