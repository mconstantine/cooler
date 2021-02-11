import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { Theme } from '../contexts/ThemeContext'

interface StorageMap {
  theme: Theme
}

function storageValueToString<K extends keyof StorageMap>(
  key: K,
  value: StorageMap[K]
): string {
  switch (key) {
    case 'theme':
      return value
    default:
      throw new Error(`Called writeStorage with unknown key "${key}"`)
  }
}

function stringToStorageValue<K extends keyof StorageMap>(
  key: K,
  value: string
): StorageMap[K] {
  switch (key) {
    case 'theme':
      return value as Theme
    default:
      throw new Error(`Called readStorage with unknown key "${key}"`)
  }
}

function setStorageValue<K extends keyof StorageMap>(
  key: K,
  value: StorageMap[K]
): void {
  const stringValue = storageValueToString(key, value)
  return window.localStorage.setItem(key, stringValue)
}

function getStorageValue<K extends keyof StorageMap>(
  key: K
): Option<StorageMap[K]> {
  return pipe(
    window.localStorage.getItem(key),
    option.fromNullable,
    option.map(value => stringToStorageValue(key, value))
  )
}

interface UseStorageOutput {
  writeStorage: typeof setStorageValue
  readStorage: typeof getStorageValue
}

export function useStorage(): UseStorageOutput {
  return {
    writeStorage: setStorageValue,
    readStorage: getStorageValue
  }
}
