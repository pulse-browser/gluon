import {
  bootstrap,
  build,
  discard,
  download,
  execute,
  exportFile,
  fixLineEndings,
  init,
  licenseCheck,
  melonPackage,
  reset,
  run,
  setupProject,
  status,
} from './commands'
import { getFFVersion } from './commands/ff-version'
import { applyPatches } from './commands/patches'
import { Cmd } from './types'

export const commands: Cmd[] = [
  {
    cmd: 'bootstrap',
    description: 'Bootstrap the melon app.',
    controller: bootstrap,
  },
  {
    cmd: 'build',
    aliases: ['b'],
    description:
      'Build the melon app. Specify the OS param for cross-platform builds.',
    options: [
      {
        arg: '--a, --arch <architecture>',
        description: 'Specify architecture for build',
      },
      {
        arg: '--u, --ui',
        description:
          'Only builds the ui. Faster but not as powerful as a regular build.',
      },
    ],
    controller: build,
  },
  {
    cmd: 'discard <file>',
    description: 'Discard a files changes.',
    options: [
      {
        arg: '--keep, --keep-patch',
        description: 'Keep the patch file instead of removing it',
      },
    ],
    controller: discard,
  },
  {
    cmd: 'download [ffVersion]',
    description: 'Download Firefox.',
    controller: download,
  },
  {
    cmd: 'execute',
    description: 'Execute a command inside the engine directory.',
    controller: execute,
  },
  {
    cmd: 'export-file <file>',
    aliases: ['export'],
    description: 'Export a changed file as a patch.',
    controller: exportFile,
  },
  {
    cmd: 'lfify',
    aliases: ['fix-le'],
    description: 'Convert CRLF line endings to Unix LF line endings.',
    controller: fixLineEndings,
  },
  {
    cmd: 'import',
    aliases: ['import-patches', 'i'],
    description: 'Import patches into the browser.',
    controller: applyPatches,
  },
  {
    cmd: 'ff-init <source>',
    aliases: ['ff-initialise', 'ff-initialize'],
    description: 'Initialise the Firefox directory.',
    controller: init,
  },
  {
    cmd: 'ff-version',
    description: 'Retrieves the version of firefox to build against',
    controller: getFFVersion,
  },
  {
    cmd: 'license-check',
    aliases: ['lc'],
    options: [
      {
        arg: '-n, --no-fix',
        description: "Do not add MPL-2.0 headers to files that don't have it",
      },
    ],
    description: 'Check the src directory for the absence of MPL-2.0 header.',
    controller: licenseCheck,
  },
  {
    cmd: 'package',
    aliases: ['pack'],
    description: 'Package the browser for distribution.',
    controller: melonPackage,
  },
  {
    cmd: 'reset',
    description: 'Reset the source directory to stock Firefox.',
    controller: reset,
  },
  {
    cmd: 'run [chrome]',
    aliases: ['r', 'open'],
    description: 'Run the browser.',
    controller: run,
  },
  {
    cmd: 'setup-project',
    description: 'Sets up a melon project for the first time',
    controller: setupProject,
  },
  {
    cmd: 'status',
    description: 'Status and files changed for src directory.',
    controller: status,
  },
]
