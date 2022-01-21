import { readFile } from 'fs/promises'
import Listr, { ListrTask } from 'listr'

import { SRC_DIR } from '../constants'
import { walkDirectory } from '../utils'

const ignoredFiles = new RegExp('.*\\.(json|patch|md)')
const licenseIgnore = new RegExp('(//) Ignore license in this file', 'g')
const fixableFiles = [{ regex: new RegExp('.*\\.js'), comment: '// ' }]

export function checkFile(path: string): ListrTask<any> {
  return {
    skip: () => ignoredFiles.test(path),
    title: path.replace(SRC_DIR, ''),
    task: async () => {
      const contents = (await readFile(path, 'utf8')).split('\n')

      const lines = [contents[0], contents[1], contents[2]].join('\n')
      const hasLicense =
        (lines.includes('the Mozilla Public') &&
          lines.includes('If a copy of the MPL was') &&
          lines.includes('http://mozilla.org/MPL/2.0/')) ||
        licenseIgnore.test(contents.join('\n'))

      if (!hasLicense) {
        throw new Error(
          `${path} does not have a license. Please add the source code header`
        )
      }
    },
  }
}

export const licenseCheck = async (): Promise<void> => {
  const files = await walkDirectory(SRC_DIR)

  await new Listr(
    files.map((file) => checkFile(file)),
    {
      concurrent: true,
      exitOnError: false,
    }
  ).run()
}
