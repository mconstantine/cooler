import { either, option } from 'fp-ts'
import { identity, pipe } from 'fp-ts/function'
import { Either } from 'fp-ts/Either'
import { Option } from 'fp-ts/Option'
import { Theme } from '../contexts/ThemeContext'
import { LoginOutput } from '../contexts/AccountContext'

interface StorageMap {
  theme: Theme
  account: LoginOutput
}

function storageValueToString<K extends keyof StorageMap>(
  key: K,
  value: StorageMap[K]
): string {
  switch (key) {
    case 'theme':
      return value as Theme
    case 'account':
      return pipe(value as LoginOutput, LoginOutput.encode, JSON.stringify)
    default:
      throw new Error(`Called writeStorage with unknown key "${key}"`)
  }
}

function stringToStorageValue<K extends keyof StorageMap>(
  key: K,
  value: string
): Option<StorageMap[K]> {
  switch (key) {
    case 'theme':
      return pipe(Theme.decode(value), option.fromEither) as Option<
        StorageMap[K]
      >
    case 'account':
      return pipe(
        either.tryCatch(() => JSON.parse(value), identity) as Either<any, any>,
        either.chain(LoginOutput.decode),
        option.fromEither
      ) as Option<StorageMap[K]>
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
    option.chain(value => stringToStorageValue(key, value))
  )
}

function clearStorageValue<K extends keyof StorageMap>(key: K): void {
  return window.localStorage.removeItem(key)
}

interface UseStorageOutput {
  writeStorage: typeof setStorageValue
  readStorage: typeof getStorageValue
  clearStorage: typeof clearStorageValue
}

export function useStorage(): UseStorageOutput {
  return {
    writeStorage: setStorageValue,
    readStorage: getStorageValue,
    clearStorage: clearStorageValue
  }
}
