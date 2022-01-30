// Init the logger before literally anything else to stop really obscure error
// messages from occurring
import { log as logInited } from './log'
export const log = logInited

import chalk from 'chalk'
import commander, { Command } from 'commander'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { errorHandler, config as configInited } from './utils'
import { commands } from './cmds'
import { BIN_NAME, ENGINE_DIR } from './constants'
import { shaCheck } from './middleware/sha-check'
import { updateCheck } from './middleware/update-check'
import { registerCommand } from './middleware/registerCommand'

// We have to use a dynamic require here, otherwise the typescript compiler
// mucks up the directory structure
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: gluon } = require('../package.json')

export const config = configInited

const program = new Command()

program.storeOptionsAsProperties(false).passCommandToAction(false)

let reportedFFVersion

if (existsSync(resolve(ENGINE_DIR, 'browser', 'config', 'version.txt'))) {
  const version = readFileSync(
    resolve(ENGINE_DIR, 'browser', 'config', 'version.txt'),
    'utf-8'
  ).replace(/\n/g, '')

  if (version !== config.version.version) reportedFFVersion = version
}


program.version(`
\t${chalk.bold(config.name)}     ${config.version.displayVersion}
\t${chalk.bold('Firefox')}         ${config.version.version} ${
  reportedFFVersion ? `(being reported as ${reportedFFVersion})` : ``
}
\t${chalk.bold('Gluon')}           ${gluon}

${
  reportedFFVersion
    ? `Mismatch detected between expected Firefox version and the actual version.
You may have downloaded the source code using a different version and
then switched to another branch.`
    : ``
}
`)
program.name(BIN_NAME)

program.option(
  '-v, --verbose',
  'Outputs extra debugging messages to the console'
)

commands.forEach((command) => {
  if (command.flags) {
    if (
      command.flags.platforms &&
      !command.flags.platforms.includes(process.platform)
    ) {
      return
    }
  }

  const _cmd = commander.command(command.cmd)

  _cmd.description(command.description)

  command?.aliases?.forEach((alias) => {
    _cmd.alias(alias)
  })

  command?.options?.forEach((opt) => {
    _cmd.option(opt.arg, opt.description)
  })

  _cmd.action(async (...args: unknown[]) => {
    log.isDebug = program.opts().verbose

    registerCommand(command.cmd)

    await shaCheck(command.cmd)
    await updateCheck()

    command.controller(...args)
  })

  program.addCommand(_cmd)
})

process.on('uncaughtException', errorHandler)
process.on('unhandledException', (err) => errorHandler(err, true))

program.parse(process.argv)
