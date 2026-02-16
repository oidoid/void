import {debug} from '../utils/debug.ts'
import type {Void} from '../void.ts'
import type {Hook, HookEnt} from './hook.ts'

export type DebutInputEnt = HookEnt<DebutInputHook>

export class DebutInputHook implements Hook {
  readonly query = 'debugInput'

  update(_ent: DebutInputEnt, v: Void): void {
    if (!debug?.input) return

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
