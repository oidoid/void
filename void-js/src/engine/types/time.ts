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
