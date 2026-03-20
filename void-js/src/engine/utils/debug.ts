/**
 * parsed debug CSV query param. when a key exists, the value is as specified
 * or `'true'` if no value. mosts void values default to
 * `'true'` when the `debug` param is empty or `'void'` is set (eg,
 * `localhost:1234?debug` or `localhost:1234?debug=void,foo=bar`). all keys
 * including `invalid` default to `'true'` when `'all'` is set. unknown keys
 * are only set if explicitly provided. keys are
 * lowercased. extend interface for additional types. doesn't handle multiple
 * values like `localhost:1234?debug=a=1,b=2&debug=b=3`.
 */
export interface Debug {
  cam?: string
  input?: string
  /** debug render invalidations. */
  invalid?: string
  looper?: string
  mem?: string
  render?: 'always' | 'error' | string
}

export const debug: Readonly<Debug> | undefined = Debug(
  globalThis.location?.href
)

export function findDebugParam(url: string): string | undefined {
  return [...new URL(url).searchParams].find(
    ([k]) => k.toLowerCase() === 'debug'
  )?.[1]
}

/** @internal */
export function Debug(url: string | undefined): Debug | undefined {
  if (!url) return
  const csv = findDebugParam(url)
  if (csv == null) return

  const debug: {[k: string]: string} = Object.fromEntries(
    csv
      .split(',') // split KV pairs.
      .filter(Boolean) // drop empties.
      .map(kv => kv.split('=')) // split each pair.
      .map(([k, v]) => [k!.toLowerCase(), v || 'true'])
  )

  const all = !csv || 'all' in debug
  const v = all || 'void' in debug
  const fallback: {[k in keyof Debug]: boolean} = {
    cam: v,
    input: v,
    invalid: all,
    looper: v,
    mem: v,
    render: v
  }

  for (const k in fallback) if (fallback[k as keyof Debug]) debug[k] ??= 'true'

  return debug as Debug
}
