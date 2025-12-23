import type * as V from '../../index.ts'

/**
 * returns [0, 59_999].
 * @internal
 */
export function renderDelayMillis(
  time: Readonly<Date>,
  debugSecs: string | undefined
): V.Millis {
  return (((debugSecs ? 0 : (59 - (time.getSeconds() % 60)) * 1000) +
    1000 -
    (time.getMilliseconds() % 1000)) %
    (debugSecs ? 1000 : 60000)) as V.Millis
}
