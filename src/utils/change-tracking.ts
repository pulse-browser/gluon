// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { readItem, writeItem } from './store'

/**
 * Generates a hash for a file. The file must be an absolute, normalized path
 * @param file File to generate a hash for
 * @returns The generated hash
 */
export async function generateHash(
  file: string,
  type = 'sha1'
): Promise<string> {
  return createHash(type)
    .update(await readFile(file))
    .digest('hex')
}

/**
 * Adds the hash to the store
 * @param file File to check
 */
export async function addHash(file: string): Promise<void> {
  const sha1 = await generateHash(file)

  // Add it to the hash file
  await writeItem('hashes', {
    ...readItem<Record<string, string>>('hashes').unwrapOr({}),
    [file]: sha1,
  })
}

export async function checkHash(file: string): Promise<boolean> {
  const hash = getHash(file)

  // If the hash doesn't exist, return false
  if (!hash) {
    return false
  }

  // Check if the hash matches
  return hash === (await generateHash(file))
}

/**
 * Return the stored hash of a file
 * @param file The file path you want to get the hash from
 * @returns The hash of the file
 */
export function getHash(file: string): string {
  const hashes = readItem<Record<string, string>>('hashes')
  // We need to provide a backup in case the hash has not been created
  return (hashes.unwrapOr({})[file] as string) || ''
}
