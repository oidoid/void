
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
