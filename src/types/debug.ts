/**
 * proxy for debug CSV query param with case-insensitive keys. when a key
 * exists, the value is as specified or `'true'` if no value. all values default
 * to `'true'` when the `debug` param is set without a CSV (eg,
 * `localhost:1234?debug`). extend interface for additional types. doesn't
 * handle multiple values like `localhost:1234?debug=a=1,b=2&debug=b=3`.
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

  const target: {[k: PropertyKey]: string | undefined} = {}
  for (const k in map) target[k.toLowerCase()] = map[k] || 'true'

  return new Proxy<{[k: string]: string | undefined}>(target, {
    get(target, k): string | undefined {
      if (typeof k !== 'string') return target[k as unknown as string]
      k = k.toLowerCase()
      return (k in target && !target[k]) || !csv ? 'true' : target[k]
    }
  })
}
