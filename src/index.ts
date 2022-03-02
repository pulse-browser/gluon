// Init the logger before literally anything else to stop really obscure error
// messages from occurring
import { log as logInited } from './log'
export const log = logInited

import commander, { Command } from 'commander'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

import { errorHandler, config as configInited, versionFormatter } from './utils'
import { commands } from './cmds'
import { BIN_NAME, ENGINE_DIR } from './constants'
import { updateCheck } from './middleware/update-check'
import { registerCommand } from './middleware/registerCommand'

// We have to use a dynamic require here, otherwise the typescript compiler
// mucks up the directory structure
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: gluonVersion } = require('../package.json')

export const config = configInited

const program = new Command()

let reportedFFVersion

if (existsSync(resolve(ENGINE_DIR, 'browser', 'config', 'version.txt'))) {
  const version = readFileSync(
    resolve(ENGINE_DIR, 'browser', 'config', 'version.txt'),
    'utf-8'
  ).replace(/\n/g, '')

  if (version !== config.version.version) reportedFFVersion = version
}

export const bin_name = BIN_NAME

program
  .name(bin_name)
  .option('-v, --verbose', 'Outputs extra debugging messages to the console')
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .version(
    versionFormatter([
      { name: config.name, value: config.version.displayVersion },
      {
        name: 'Firefox',
        value: `${config.version.version} ${
          reportedFFVersion ? `(being reported as ${reportedFFVersion})` : ''
        }`,
      },
      { name: 'Gluon', value: gluonVersion },
      reportedFFVersion
        ? `Mismatch detected between expected Firefox version and the actual version.
You may have downloaded the source code using a different version and
then switched to another branch.`
        : '',
    ])
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

  const buildCommand = commander
    .command(command.cmd)
    .description(command.description)

  command?.aliases?.forEach((alias) => {
    buildCommand.alias(alias)
  })

  command?.options?.forEach((opt) => {
    buildCommand.option(opt.arg, opt.description)
  })

  buildCommand
    .action(async (...args: unknown[]) => {
      log.isDebug = program.opts().verbose

      registerCommand(command.cmd)

      await updateCheck()

      command.controller(...args)
    })
    .addCommand(buildCommand)
})

process
  .on('uncaughtException', errorHandler)
  .on('unhandledException', (err) => errorHandler(err, true))

program.parse(process.argv)
