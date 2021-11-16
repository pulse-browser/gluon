import { writeFileSync } from 'fs'
import { resolve } from 'path'

export function registerCommand(command: string): void {
  writeFileSync(resolve(process.cwd(), '.dotbuild', 'command'), command)
}
