/**
 * proxy for debug CSV query param with case-insensitive keys. when a key
 * exists, the value is as specified or `'true'` if no value. void values
 * default to `'true'` when the `debug` param is empty or `'void'` is set (eg,
 * `localhost:1234?debug` or `localhost:1234?debug=void,foo=bar`). all values
 * default to true when `'all'` is set. extend interface for additional types.
 * doesn't handle multiple values like `localhost:1234?debug=a=1,b=2&debug=b=3`.
 */
export interface Debug {
  cam?: string
  input?: string
  mem?: string
  render?: string
}

export const debug: Readonly<Debug> | undefined = Debug(
  globalThis.location?.href
)

/** @internal */
export function Debug(url: string | undefined): Debug | undefined {
  if (!url) return
  const csv = [...new URL(url).searchParams].find(
    ([k]) => k.toLowerCase() === 'debug'
  )?.[1]
  if (csv == null) return
  const map = Object.fromEntries(
    csv
      .split(',') // split KV pairs.
      .filter(Boolean) // drop empties.
      .map(kv => kv.split('=')) // split each pair.
  )

  const target: {[k: string]: string} = {}
  for (const k in map) target[k.toLowerCase()] = map[k] || 'true'

  const voidKeyset: {[_ in keyof Omit<Debug, 'invalid'>]-?: undefined} = {
    cam: undefined,
    input: undefined,
    mem: undefined,
    render: undefined
  }

  return new Proxy<{[k: string]: string}>(target, {
    get(target, k): string | undefined {
      if (typeof k !== 'string') return target[k as unknown as string]
      k = k.toLowerCase()
      return !csv || 'all' in map || (k in voidKeyset && 'void' in map)
        ? target[k] || 'true'
        : target[k]
    }
  })
}
