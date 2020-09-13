export function definitely<T>(src: T | undefined | null) {
  return src as T
}
