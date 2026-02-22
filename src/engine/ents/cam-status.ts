import {isFullscreen} from '../utils/fullscreen-util.ts'
import type {Void} from '../void.ts'
import type {Hook, HookEnt} from './hook.ts'
import {textSetText} from './text.ts'

export type CamStatusEnt = HookEnt<CamStatusHook>

export class CamStatusHook implements Hook {
  readonly query = 'camStatus & text'

  update(ent: CamStatusEnt, v: Void): void {
    const {x, y, w, h, scale} = v.cam
    const scaleFmt = scale.toFixed(3).replace(/\.?0+$/, '')
    const f = isFullscreen() ? 'f' : ''
    textSetText(
      ent,
      `(${Math.round(x)}, ${Math.round(y)}) ${w}x${h}${f}@${scaleFmt}x`
    )
  }
}
