import axios from 'axios'
import { SupportedProducts } from './config'

const firefoxTargets = JSON.parse(`{
  "${SupportedProducts.Firefox}": "LATEST_FIREFOX_VERSION",
  "${SupportedProducts.FirefoxBeta}": "LATEST_FIREFOX_DEVEL_VERSION",
  "${SupportedProducts.FirefoxDev}": "FIREFOX_DEVEDITION",
  "${SupportedProducts.FirefoxESR}": "FIREFOX_ESR",
  "${SupportedProducts.FirefoxESRNext}": "FIREFOX_ESR_NEXT",
  "${SupportedProducts.FirefoxNightly}": "FIREFOX_NIGHTLY"
}`)

export const getLatestFF = async (
  product: SupportedProducts = SupportedProducts.Firefox
): Promise<string> => {
  const { data } = await axios.get(
    'https://product-details.mozilla.org/1.0/firefox_versions.json'
  )

  return data[firefoxTargets[product]]
}
