import chalk from 'chalk'

export const versionFormatter = (
  options: ({ name: string; value: string } | null | string)[]
): string => {
  const spacesValue = Math.max(
    ...options.map((arg) =>
      typeof arg === 'string' ? 0 : arg?.value?.length || 0
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
      spacesValue - argument.name.length
    )}   ${argument.value}\n`
  }

  return versionResponse
}
