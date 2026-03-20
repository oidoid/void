declare global {
  interface DateConstructor {
    now(): UTCMillis
  }

  interface Performance {
    now(): Millis
  }
}

/** duration in milliseconds. */
export type Millis = (number & {readonly millis: unique symbol}) | 0

/** duration in seconds. */
export type Secs = (number & {readonly secs: unique symbol}) | 0

export type UTCMillis = number & {readonly utcMillis: unique symbol}

export function dateToTimestamp(date: Readonly<Date>): string {
  const yyyy = `${date.getFullYear()}`.padStart(4, '0')
  const MM = `${date.getMonth() + 1}`.padStart(2, '0')
  const dd = `${date.getDate()}`.padStart(2, '0')
  const hh = `${date.getHours()}`.padStart(2, '0')
  const mm = `${date.getMinutes()}`.padStart(2, '0')
  const ss = `${date.getSeconds()}`.padStart(2, '0')
  return `${yyyy}${MM}${dd}${hh}${mm}${ss}`
}

/**
 * returns [0, 59_999].
 * @internal
 */
export function millisUntilNext(
  time: Readonly<Date>,
  next: 'Sec' | 'Min'
): Millis {
  return (((next === 'Sec' ? 0 : (59 - (time.getSeconds() % 60)) * 1000) +
    1000 -
    (time.getMilliseconds() % 1000)) %
    (next === 'Sec' ? 1000 : 60000)) as Millis
}
