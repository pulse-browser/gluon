// Defines config that should be set dynamically on the users system. This allows
// for interfacing between these values

import { log } from '../log'
import { readItem, writeItem } from './store'

export const defaultValues: {
  brand: string
  buildMode: 'dev' | 'debug' | 'release'
  marPath: string
} = {
  brand: 'unofficial',
  buildMode: 'dev',
  marPath: '',
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
  readItem(`dynamicConfig.${key}`).unwrapOrElse(() => {
    log.info(
      `Dynamic config '${key} not set, defaulting to '${defaultValues[key]}'`
    )
    return defaultValues[key]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any

export const set: DynamicSetter<keyof DefaultValuesType> = (key, value) =>
  writeItem(`dynamicConfig.${key}`, value)
