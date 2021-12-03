import execa from 'execa'
import { log } from '..'

const handle = (
  data: string | Error,
  logger: (data: string) => void,
  killOnError?: boolean
) => {
  const d = data.toString()

  d.split('\n').forEach((line: string) => {
    if (line.length !== 0) logger(line.replace(/\s\d{1,5}:\d\d\.\d\d /g, ''))
  })

  if (killOnError) {
    log.error('Command failed. See error above.')
    process.exit(1)
  }
}

export const dispatch = (
  cmd: string,
  args?: string[],
  cwd?: string,
  killOnError?: boolean,
  logger = (data: string) => log.info(data)
): Promise<boolean> =>
  new Promise((resolve) => {
    process.env.MACH_USE_SYSTEM_PYTHON = 'true'

    const proc = execa(cmd, args, {
      cwd: cwd || process.cwd(),
      env: process.env,
    })

    proc.stdout?.on('data', (d) => handle(d, logger))
    proc.stderr?.on('data', (d) => handle(d, logger))

    proc.stdout?.on('error', (d) => handle(d, logger, killOnError))
    proc.stderr?.on('error', (d) => handle(d, logger, killOnError))

    proc.on('exit', () => {
      resolve(true)
    })
  })
