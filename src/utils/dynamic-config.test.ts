// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import * as dynamicConfig from './dynamic-config'
import { readItem, removeItem } from './store'

describe('set', () => {
  it('runs without errors', () => dynamicConfig.set('brand', 'test'))
  it('stores the value', () => {
    dynamicConfig.set('brand', 'test2')
    expect(readItem('dynamicConfig.brand').unwrap()).toBe('test2')
  })
})

describe('get', () => {
  it('returns a value when there is nothing', () => {
    removeItem('dynamicConfig.buildMode')
    expect(dynamicConfig.get('buildMode')).toBe('dev')
  })

  it('returns the value just stored', () => {
    dynamicConfig.set('buildMode', 'debug')
    expect(dynamicConfig.get('buildMode')).toBe('debug')
  })
})
