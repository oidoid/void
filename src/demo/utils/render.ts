/** returns [0, 59_999]. */
export function renderDelayMillis(
  time: Readonly<Date>,
  debugSecs: string | undefined
): number {
  return (
    ((debugSecs ? 0 : (59 - (time.getSeconds() % 60)) * 1000) +
      1000 -
      (time.getMilliseconds() % 1000)) %
    (debugSecs ? 1000 : 60_000)
  )
}
