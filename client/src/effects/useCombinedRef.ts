import { MutableRefObject, RefObject, useEffect, useRef } from 'react'

type ReactRef<T> =
  | ((instance: T | null) => void)
  | MutableRefObject<T | null>
  | null

export function useCombinedRefs<T>(...refs: ReactRef<T>[]): RefObject<T> {
  const combinedRef = useRef<T>(null)

  useEffect(() => {
    refs.forEach(ref => {
      if (!ref) {
        return
      }

      if (typeof ref === 'function') {
        ref(combinedRef.current)
      } else {
        ref.current = combinedRef.current
      }
    })
  }, [refs])

  return combinedRef
}
