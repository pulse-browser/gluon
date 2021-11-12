import { createWriteStream } from 'fs'

import axios from 'axios'
import cliProgress from 'cli-progress'

export async function downloadFileToLocation(
  url: string,
  writeOut: string
): Promise<void> {
  return new Promise((resolve, reject) =>
    (async () => {
      const { data, headers } = await axios.get(url, {
        responseType: 'stream',
      })

      const length = headers['content-length']

      const writer = createWriteStream(writeOut)

      let receivedBytes = 0

      const progressBar = new cliProgress.SingleBar({})
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

      data.on('end', async () => {
        clearInterval(progressInterval)
        progressBar.stop()
        resolve()
      })
    })()
  )
}
