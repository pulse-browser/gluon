import chalk from 'chalk'

class Log {
  private startTime: number

  isDebug = false

  constructor() {
    const d = new Date()

    this.startTime = d.getTime()
  }

  getDiff(): string {
    const d = new Date()

    const currentTime = d.getTime()

    const elapsedTime = currentTime - this.startTime

    const secs = Math.floor((elapsedTime / 1000) % 60)
    const mins = Math.floor((elapsedTime / (60 * 1000)) % 60)
    const hours = Math.floor((elapsedTime / (60 * 60 * 1000)) % 24)

    const format = (r: number) => (r.toString().length == 1 ? `0${r}` : r)

    return `${format(hours)}:${format(mins)}:${format(secs)}`
  }

  debug(...args: unknown[]): void {
    if (this.isDebug) console.debug(...args)
  }

  info(...args: unknown[]): void {
    console.info(chalk.blueBright.bold(this.getDiff()), ...args)
  }

  warning(...args: unknown[]): void {
    console.warn(chalk.yellowBright.bold(' WARNING'), ...args)
  }

  async hardWarning(...args: unknown[]): Promise<void> {
    console.info('', chalk.bgRed.bold('WARNING'), ...args)

    const { answer } = await prompts({
      type: 'confirm',
      name: 'answer',
      message: 'Are you sure you want to continue?',
    })

    if (!answer) process.exit(0)
  }

  success(...args: unknown[]): void {
    console.log(`\n${chalk.greenBright.bold('SUCCESS')}`, ...args)
  }

  error(...args: unknown[]): never {
    if (args[0] instanceof Error) {
      throw args[0]
    }

    throw new Error(
      ...args.map((a) =>
        typeof a !== 'undefined' ? (a as object).toString() : a
      )
    )
  }

  askForReport(): void {
    console.info(
      'The following error is a bug. Please open an issue on the melon issue structure with a link to your repository and the output from this command.'
    )
    console.info(
      'The melon issue tracker is located at: https://github.com/dothq/melon/issues'
    )
  }
}

export const log = new Log()

export default Log
