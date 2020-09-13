export function removeUndefined<
  T extends {
    [key: string]: any
  }
>(src: T): Partial<T> {
  return Object.entries(src)
    .filter(([, value]) => value !== undefined)
    .reduce((res, [key, value]) => ({ ...res, [key]: value }), {})
}
