import kleur from 'kleur'

export type LoggingMode = 'silent' | 'normal'
export type LoggingErrorMode = 'inline' | 'throw'

export interface Task {
  name: string
  skip?: () => boolean | Promise<boolean>
  long?: boolean
  task: (
    log: (message: string) => void
  ) => void | Promise<void> | TaskList | Promise<TaskList>
}

export class TaskList {
  tasks: Task[]
  loggingStyle: LoggingMode = 'normal'
  loggingIndentation = ''
  loggingOnError: LoggingErrorMode = 'throw'

  error?: Error

  constructor(tasks: Task[]) {
    this.tasks = tasks
  }

  style(style: LoggingMode) {
    this.loggingStyle = style
    return this
  }

  indent(indentation: string) {
    this.loggingIndentation = indentation
    return this
  }

  onError(mode: LoggingErrorMode) {
    this.loggingOnError = mode
    return this
  }

  private log(
    type: 'start' | 'finish' | 'fail' | 'skip' | 'info',
    name: string
  ) {
    if (this.loggingStyle == 'silent') return

    let prefix = this.loggingIndentation
    const prefixTemplate = `[${type.toUpperCase()}]`

    switch (type) {
      case 'start': {
        prefix += kleur.bold().gray(prefixTemplate)
        break
      }
      case 'finish': {
        prefix += kleur.bold().green(prefixTemplate)
        break
      }
      case 'fail': {
        prefix += kleur.bold().red(prefixTemplate)
        break
      }
      case 'skip': {
        prefix += kleur.bold().yellow(prefixTemplate)
        break
      }
      case 'info': {
        prefix += '  '
        prefix += kleur.bold().cyan(prefixTemplate)
        break
      }
    }

    console.log(`${prefix} ${name}`)
  }

  async run() {
    for (const task of this.tasks) {
      if (task.skip && (await task.skip())) {
        this.log('skip', task.name)
        continue
      }

      if (task.long) {
        this.log('start', task.name)
      }

      try {
        const result = await task.task((message: string) =>
          this.log('info', message)
        )

        if (result instanceof TaskList) {
          // We want to provide a start point if none exists already
          if (!task.long) {
            this.log('start', task.name)
          }

          await result.indent(this.loggingIndentation + '  ').run()
        }
      } catch (error) {
        if (this.loggingOnError == 'throw') {
          this.log('fail', task.name)
          throw error
        }

        if (this.loggingOnError == 'inline') {
          this.log('fail', `${task.name}: ${error}`)
        }

        this.error = error as Error
      }

      this.log('finish', task.name)
    }

    if (this.error) {
      throw this.error
    }
  }
}
