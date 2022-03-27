// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Cmd } from './types'

export const commands: Cmd[] = [
  {
    cmd: 'bootstrap',
    description: 'Bootstrap the melon app.',
    requestController: async () =>
      (await import('./commands/bootstrap')).bootstrap,
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
    requestController: async () => (await import('./commands/build')).build,
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
    requestController: async () => (await import('./commands/discard')).discard,
  },
  {
    cmd: 'download [ffVersion]',
    description: 'Download Firefox.',
    requestController: async () =>
      (await import('./commands/download')).download,
  },
  {
    cmd: 'execute',
    description: 'Execute a command inside the engine directory.',
    requestController: async () => (await import('./commands/execute')).execute,
  },
  {
    cmd: 'export-file <file>',
    aliases: ['export'],
    description: 'Export a changed file as a patch.',
    requestController: async () =>
      (await import('./commands/export-file')).exportFile,
  },
  {
    cmd: 'lfify',
    aliases: ['fix-le'],
    description: 'Convert CRLF line endings to Unix LF line endings.',
    requestController: async () =>
      (await import('./commands/fix-le')).fixLineEndings,
  },
  {
    cmd: 'import',
    aliases: ['import-patches', 'i'],
    description: 'Import patches into the browser.',
    requestController: async () =>
      (await import('./commands/patches')).applyPatches,
  },
  {
    cmd: 'ff-init <source>',
    aliases: ['ff-initialise', 'ff-initialize'],
    description: 'Initialise the Firefox directory.',
    requestController: async () => (await import('./commands/init')).init,
  },
  {
    cmd: 'ff-version',
    description: 'Retrieves the version of firefox to build against',
    requestController: async () =>
      (await import('./commands/ff-version')).getFFVersion,
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
    requestController: async () =>
      (await import('./commands/license-check')).licenseCheck,
  },
  {
    cmd: 'package',
    aliases: ['pack'],
    description: 'Package the browser for distribution.',
    requestController: async () =>
      (await import('./commands/package')).melonPackage,
  },
  {
    cmd: 'reset',
    description: 'Reset the source directory to stock Firefox.',
    requestController: async () => (await import('./commands/reset')).reset,
  },
  {
    cmd: 'run [chrome]',
    aliases: ['r', 'open'],
    description: 'Run the browser.',
    requestController: async () => (await import('./commands/run')).run,
  },
  {
    cmd: 'setup-project',
    description: 'Sets up a melon project for the first time',
    requestController: async () =>
      (await import('./commands/setupProject')).setupProject,
  },
  {
    cmd: 'status',
    description: 'Status and files changed for src directory.',
    requestController: async () => (await import('./commands/status')).status,
  },
]
