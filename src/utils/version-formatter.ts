// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import chalk from 'chalk'

export const versionFormatter = (
  options: ({ name: string; value: string } | null | string)[]
): string => {
  const spacesValue = Math.max(
    ...options.map((argument) =>
      typeof argument === 'string' ? 0 : argument?.value?.length || 0
    )
  )

  let versionResponse = ''

  for (const argument of options) {
    if (argument === null) {
      versionResponse += '\n'
      continue
    }

    if (typeof argument === 'string') {
      versionResponse += `\n${argument}\n`
      continue
    }

    versionResponse += `\t${chalk.bold(argument.name)} ${' '.repeat(
      Math.max(spacesValue - argument.name.length, 0)
    )}   ${argument.value}\n`
  }

  return versionResponse
}
