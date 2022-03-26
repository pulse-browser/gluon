import { readFile } from 'fs/promises'
import { createHash } from 'crypto'
import { readItem, writeItem } from './store'

/**
 * Generates a hash for a file. The file must be an absolute, normalized path
 * @param file File to generate a hash for
 * @returns The generated hash
 */
export async function generateHash(file: string): Promise<string> {
  // I know that sha1 is not a great hashing algorithm, but it's good enough
  // for tracking file changes
  const hash = createHash('sha1')

  // Read the file, add it to the hash as a binary. End the hash so I can write
  // it out
  hash.setEncoding('binary')
  hash.write(await readFile(file, 'binary'))
  hash.end()

  // Generate the hash
  return hash.read()
}

/**
 * Adds the hash to the store
 * @param file File to check
 */
export async function addHash(file: string): Promise<void> {
  const sha1 = await generateHash(file)

  // Add it to the hash file
  await writeItem('hashes', {
    ...readItem<Record<string, string>>('hashes'),
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
