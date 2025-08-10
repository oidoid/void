/**
 * values are nonempty strings. each value defaults to `'true'` when key is
 * present. all values default to `'true'` when no `debug` param is set without
 * CSV.
 */
export type Debug =
  | ({[K in 'cam' | 'input' | 'render']?: string} & {
      [k: string]: string
    })
  | undefined

export const debug: Readonly<Debug> = Debug(globalThis.location)

/** @internal */
export function Debug(location: {readonly href: string} | undefined): Debug {
  if (!location) return
  const csv = new URL(location.href.toLowerCase()).searchParams.get('debug')
  if (csv == null) return
  const map = Object.fromEntries(
    csv
      .split(',')
      .filter(Boolean)
      .map(kv => kv.split('='))
  )
  const debug: {[k: string]: string} = {}
  const keyset: {[_ in keyof Debug]-?: undefined} = {
    cam: undefined,
    input: undefined,
    render: undefined
  }
  for (const k in keyset) {
    const lowerK = k.toLowerCase()
    if (!csv || lowerK in map) debug[k] = map[lowerK] || 'true'
    delete map[lowerK]
  }
  for (const k in map) debug[k] = map[k] || 'true'
  return debug
}
