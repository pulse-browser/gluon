// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { equip, None, OptionEquipped } from 'rustic'

import { MELON_DIR } from '../constants'

export const readItem = <T>(key: string): OptionEquipped<T> => {
  const fileLocation = join(MELON_DIR, `${key}.json`)

  if (!existsSync(fileLocation)) {
    return equip<T>(None)
  }

  const data = readFileSync(fileLocation).toString()

  return equip(JSON.parse(data))
}

export const writeItem = <T>(key: string, data: T) => {
  const fileLocation = join(MELON_DIR, `${key}.json`)
  writeFileSync(fileLocation, JSON.stringify(data, undefined, 2))
}

export const removeItem = (key: string) => {
  if (existsSync(join(MELON_DIR, `${key}.json`)))
    unlinkSync(join(MELON_DIR, `${key}.json`))
}
