import {isFullscreen} from '../utils/fullscreen-util.ts'
import type {Void} from '../void.ts'
import type {Hook, HookEnt} from './hook.ts'
import {textSetText} from './text.ts'

export type CamStatsEnt = HookEnt<CamStatsHook>

export class CamStatsHook implements Hook {
  readonly query = 'camStats & text'

  update(ent: CamStatsEnt, v: Void): void {
    const {x, y, w, h, scale} = v.cam
    const scaleFmt = scale.toFixed(3).replace(/\.?0+$/, '')
    const f = isFullscreen() ? 'f' : ''
    textSetText(
      ent,
      `(${Math.round(x)}, ${Math.round(y)}) ${w}x${h}${f}@${scaleFmt}x`
    )
  }
}
