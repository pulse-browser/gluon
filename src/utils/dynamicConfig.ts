// Defines config that should be set dynamically on the users system. This allows
// for interfacing between these values

import { log } from '../log'
import { readItem, writeItem } from './store'

export type ValidDynamicEntries = 'brand'
export const defaultValues: {
  brand: string
  buildMode: 'dev' | 'debug' | 'release'
} = {
  brand: 'unofficial',
  buildMode: 'dev',
}

export type DefaultValuesType = typeof defaultValues
export type DefaultValuesKeys = keyof DefaultValuesType

type DynamicGetter<K extends keyof DefaultValuesType> = (
  key: K
) => DefaultValuesType[K]
type DynamicSetter<K extends keyof DefaultValuesType> = (
  key: K,
  value: DefaultValuesType[K]
) => void

export const get: DynamicGetter<keyof DefaultValuesType> = (key) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readItem(`dynamicConfig.${key}`).unwrapOrElse(() => {
    log.info(
      `Dynamic config '${key} not set, defaulting to '${defaultValues[key]}'`
    )
    return defaultValues[key]
  }) as any

export const set: DynamicSetter<keyof DefaultValuesType> = (key, value) =>
  writeItem(key, value)
