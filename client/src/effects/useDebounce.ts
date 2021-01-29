import { useRef } from 'react'
import { DEBOUNCE_TIME } from '../components/constants'

export function useDebounce<F extends (...args: any[]) => void>(
  callback: F,
  time = DEBOUNCE_TIME
): F {
  const timeout = useRef<number>()

  return function (...args: any): void {
    window.clearTimeout(timeout.current)

    timeout.current = window.setTimeout(() => {
      callback(...args)
      timeout.current = undefined
    }, time)
  } as F
}
