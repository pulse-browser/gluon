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
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .name(bin_name)
  .option('-v, --verbose', 'Outputs extra debugging messages to the console')
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
        ? `Mismatch detected between expected Firefox version and the actual version.\nYou may have downloaded the source code using a different version and\nthen switched to another branch.`
        : '',
    ])
  )

async function middleware(command: commander.Command, args: unknown[]) {
  // If the program is verbose, store that fact within the logger
  log.isDebug = program.opts().verbose

  await updateCheck()
  registerCommand(command.name())
}

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
    .aliases(command?.aliases || [])
    .action(async (...args) => {
      // Start loading the controller in the background whilst middleware is
      // executing
      const controller = command.requestController()

      await middleware(buildCommand, args)

      // Finish loading the controller and execute it
      ;(await controller)(...args)
    })

  // Register all of the required options
  command?.options?.forEach((opt) => {
    buildCommand.option(opt.arg, opt.description)
  })

  program.addCommand(buildCommand)
})

process
  .on('uncaughtException', errorHandler)
  .on('unhandledException', (err) => errorHandler(err, true))

program.parse(process.argv)
