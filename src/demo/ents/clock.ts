import * as V from '../../index.ts'

export type ClockEnt = V.SysEnt<ClockSys>

/** writes to text, invalid. */
export class ClockSys implements V.Sys {
  readonly query = 'clock & text'

  update(ent: ClockEnt): void {
    V.textSetText(ent, timeString(new Date()))
  }
}

/** @internal */
export function timeString(time: Readonly<Date>): string {
  const hh = `${time.getHours() % 12 || 12}`.padStart(2, ' ')
  const mm = `${time.getMinutes()}`.padStart(2, '0')
  const ss = `${time.getSeconds()}`.padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}
