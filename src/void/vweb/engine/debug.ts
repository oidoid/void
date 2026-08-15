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
  draw?: 'always' | string
  input?: string
  /** debug draw invalidations. */
  invalid?: string
  looper?: string
  mem?: string
  window?: string
  zzz?: string
}

type DebugParams = {[k: string]: string}

const debugParams: DebugParams = {}

export let debug: Debug | undefined = debugFromURL(
  globalThis.location?.href,
  debugParams
)

export function findDebugParam(url: string): string | undefined {
  return [...new URL(url).searchParams].find(
    ([k]) => k.toLowerCase() === 'debug'
  )?.[1]
}

export function setDrawAlwaysParam(always: boolean): void {
  setDebugParam('draw', always ? 'always' : undefined)
}

export function setWakelockParam(enabled: boolean): void {
  setDebugParam('zzz', enabled ? undefined : 'true')
}

export function setFullscreenParam(enabled: boolean): void {
  setDebugParam('window', enabled ? undefined : 'true')
}

export function setDebugParam(key: keyof Debug, val: string | undefined): void {
  if (val) {
    debug ??= {}
    debug[key] = val
    debugParams[key] = val
  } else {
    if (debug) delete debug[key]
    delete debugParams[key]
  }

  const csv = Object.entries(debugParams)
    .map(([k, v]) => (v === 'true' ? k : `${k}=${v}`))
    .join(',')

  const url = new URL(location.href)
  const keys = [...url.searchParams.keys()].filter(
    k => k.toLowerCase() === 'debug'
  )
  for (const k of keys) url.searchParams.delete(k)
  if (csv) {
    url.searchParams.set('debug', csv)
    const encoded = new URLSearchParams({debug: csv}).toString()
    url.search = url.search.replace(encoded, `debug=${csv}`)
  } else debug = undefined

  history.replaceState(history.state, '', url)
}

function debugFromURL(
  url: string | undefined,
  params: DebugParams | undefined
): Debug | undefined {
  if (!url) return
  const csv = findDebugParam(url)
  if (csv == null) return

  const vals: DebugParams = Object.fromEntries(
    csv
      .split(',') // split KV pairs.
      .filter(Boolean) // drop empties.
      .map(kv => kv.split('=')) // split each pair.
      .map(([k, v]) => [k!.toLowerCase(), v || 'true'])
  )
  if (params) Object.assign(params, vals)
  const debug: DebugParams = {...vals}

  const all = !csv || 'all' in debug
  const v = all || 'void' in debug
  const fallback: {[k in keyof Debug]: boolean} = {
    cam: v,
    draw: false,
    input: v,
    invalid: all,
    looper: v,
    mem: v
  }

  for (const k in fallback) if (fallback[k as keyof Debug]) debug[k] ??= 'true'

  return debug as Debug
}

/** @internal */
export function Debug(url: string | undefined): Debug | undefined {
  return debugFromURL(url, undefined)
}
