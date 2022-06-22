// Defines config that should be set dynamically on the users system. This allows
// for interfacing between these values

import { readItem, writeItem } from './store'

export type ValidDynamicEntries = 'brand'
export const defaultValues: {
  brand: string
} = {
  brand: 'unofficial',
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
  readItem(`dynamicConfig.${key}`).unwrapOr(defaultValues[key]) as any

export const set: DynamicSetter<keyof DefaultValuesType> = (key, value) =>
  writeItem(key, value)
