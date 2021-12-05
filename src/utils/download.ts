import { createWriteStream } from 'fs'

import axios from 'axios'
import cliProgress from 'cli-progress'
import { Duplex } from 'stream'

export async function downloadFileToLocation(
  url: string,
  writeOutPath: string,
  consoleWriter?: (message: string) => void
): Promise<void> {
  return new Promise((resolve, reject) =>
    (async () => {
      const { data, headers } = await axios.get(url, {
        responseType: 'stream',
      })

      const length = headers['content-length']

      const writer = createWriteStream(writeOutPath)

      let receivedBytes = 0

      const progressBar = new cliProgress.SingleBar({
        stream: consoleWriter
          ? new Duplex({
              write: (chunk, enconding, next) => {
                consoleWriter(chunk.toString())
                next()
              },
              read: (size) => {
                /* Empty output */
              },
            })
          : process.stdout,
      })
      progressBar.start(length, receivedBytes)

      data.on('data', (chunk: { length: number }) => {
        receivedBytes += chunk.length
      })
      data.pipe(writer)
      data.on('error', (err: unknown) => reject(err))

      const progressInterval = setInterval(
        () => progressBar.update(receivedBytes),
        500
      )

      data.on('end', () => {
        clearInterval(progressInterval)
        progressBar.stop()
        resolve()
      })
    })()
  )
}
