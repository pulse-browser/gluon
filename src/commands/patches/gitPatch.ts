import execa from 'execa'
import { PATCH_ARGS, ENGINE_DIR } from '../../constants'

export async function apply(path: string): Promise<void> {
  try {
    await execa('git', ['apply', '-R', ...PATCH_ARGS, path], {
      cwd: ENGINE_DIR,
    })
  } catch (_e) {
    // If the patch has already been applied, we want to revert it. Because
    // there is no good way to check this we are just going to catch and
    // discard the error
    null
  }

  const { stdout, exitCode } = await execa(
    'git',
    ['apply', ...PATCH_ARGS, path],
    { cwd: ENGINE_DIR }
  )

  if (exitCode != 0) throw stdout
}
