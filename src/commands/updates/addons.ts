import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { create } from 'xmlbuilder2'
import { DIST_DIR } from '../../constants'
import {
  dynamicConfig,
  ensureDirectory,
  generateHash,
  getSize,
} from '../../utils'
import {
  downloadAddon,
  getAddons,
  resolveAddonDownloadUrl,
} from '../download/addon'

export async function generateAddonUpdateFiles() {
  const addons = []

  for (const addon of getAddons()) {
    const url = await resolveAddonDownloadUrl(addon)
    const xpi = await downloadAddon(url, addon)

    addons.push({
      ...addon,
      url,
      xpi,
      hash: await generateHash(xpi, 'sha256'),
      hashType: 'sha256',
      size: await getSize(xpi),
    })
  }

  const root = create().ele('updates').ele('addons')

  for (const addon of addons) {
    const addonNode = root.ele('addon')
    addonNode.att('id', addon.id)
    addonNode.att('URL', addon.url)
    addonNode.att('hashFunction', addon.hashType)
    addonNode.att('hashValue', addon.hash)
    addonNode.att('size', addon.size.toString())
    addonNode.att('version', addon.version)
  }

  const path = join(
    DIST_DIR,
    'update/browser/addons',
    dynamicConfig.get('brand'),
    'update.xml'
  )

  await ensureDirectory(dirname(path))
  await writeFile(path, root.end({ prettyPrint: true }))
}
