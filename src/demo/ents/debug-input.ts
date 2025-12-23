import * as V from '../../index.ts'
import type {Game} from '../game.ts'

export type DebutInputEnt = V.QueryEnt<DebutInputSys['query']>

export class DebutInputSys implements V.Sys {
  readonly query = 'debugInput' as const

  update(_ent: DebutInputEnt, v: Game): void {
    if (!V.debug?.input) return

    if (v.input.started) {
      const on = !!v.input.on.length
      if (on) console.debug(`[input] buttons on: ${v.input.on.join(' ')}.`)
      else console.debug(`[input] buttons off.`)
      const combo = v.input.combo
      if (combo.length > 1 && on)
        console.debug(
          `[input] combo: ${combo.map(set => set.join('+')).join(' ')}.`
        )
    }
    if (v.input.point?.invalid && v.input.point?.click && !v.input.point.pinch)
      console.debug(
        `[input] ${v.input.point.drag.on ? 'drag' : 'click'} xy: ${v.input.point.x} ${v.input.point.y}.`
      )
    if (v.input.point?.pinch)
      console.debug(
        `[input] pinch xy: ${v.input.point.pinch.xy.x} ${v.input.point.pinch.xy.y}.`
      )
    if (v.input.wheel)
      console.debug(
        `[input] wheel xy: ${v.input.wheel.delta.xy.x} ${v.input.wheel.delta.xy.y}.`
      )
  }
}
