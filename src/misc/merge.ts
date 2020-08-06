export function merge(...args: Object[]) {
  const target = {} as { [key: string]: any }

  const merger = (source: Object) => {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const obj = source as { [key: string]: any }
        const propType = Object.prototype.toString.call(obj[key])

        if (propType === '[object Object]') {
          target[key] = merge(target[key], obj[key])
        } else {
          target[key] = obj[key]
        }
      }
    }
  }

  args.forEach(arg => merger(arg))
  return target
}
