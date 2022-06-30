import { useCallback, useRef } from 'react'
import { DEBOUNCE_TIME } from '../components/constants'

export function useDebounce<F extends (...args: any[]) => void>(
  callback: F,
  time = DEBOUNCE_TIME
): F {
  const timeout = useRef<number>()

  const debounced = useCallback(
    (...args: any): void => {
      window.clearTimeout(timeout.current)

      timeout.current = window.setTimeout(() => {
        callback(...args)
        timeout.current = undefined
      }, time)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [time]
  )

  return debounced as F
}
