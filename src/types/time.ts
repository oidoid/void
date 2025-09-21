declare global {
  interface DateConstructor {
    now(): UTCMillis
  }

  interface Performance {
    now(): Millis
  }
}

declare const millis: unique symbol
/** duration in milliseconds. */
export type Millis = number & {readonly [millis]: never}

declare const utcMillis: unique symbol
export type UTCMillis = number & {readonly [utcMillis]: never}

export function dateToTimestamp(date: Readonly<Date>): string {
  const yyyy = `${date.getFullYear()}`.padStart(4, '0')
  const MM = `${date.getMonth() + 1}`.padStart(2, '0')
  const dd = `${date.getDate()}`.padStart(2, '0')
  const hh = `${date.getHours()}`.padStart(2, '0')
  const mm = `${date.getMinutes()}`.padStart(2, '0')
  const ss = `${date.getSeconds()}`.padStart(2, '0')
  return `${yyyy}${MM}${dd}${hh}${mm}${ss}`
}
