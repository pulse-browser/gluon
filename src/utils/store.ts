import { existsSync, readFileSync } from 'fs'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { equip, None, OptionEquipped } from 'rustic'

import { MELON_DIR } from '../constants'

export const readItem = <T>(key: string): OptionEquipped<T> => {
  const dir = join(MELON_DIR, `${key}.json`)

  if (!existsSync(dir)) {
    return equip<T>(None)
  }

  const data = readFileSync(dir, 'utf8')

  return equip(JSON.parse(data))
}

export const writeItem = async <T>(key: string, data: T): Promise<void> => {
  const dir = join(MELON_DIR, `${key}.json`)
  await writeFile(dir, JSON.stringify(data, null, 2))
}
