import {isFullscreen} from '../utils/fullscreen-util.ts'
import type {Void} from '../void.ts'
import type {Hook, HookEnt} from './hook.ts'
import {textSetText} from './text.ts'

export type CamStatusEnt = HookEnt<CamStatusHook>

export class CamStatusHook implements Hook {
  readonly query = 'camStatus & text'

  update(ent: CamStatusEnt, v: Void): void {
    if (!v.cam.invalid) return
    const scaleFmt = v.cam.scale.toFixed(1).replace(/\.?0+$/, '')
    const xFmt = v.cam.x.toFixed(1)
    const yFmt = v.cam.y.toFixed(1)
    const f = isFullscreen() ? 'f' : ''
    textSetText(
      ent,
      `${v.cam.w}x${v.cam.h}${f}@${scaleFmt}x (${xFmt}, ${yFmt})`
    )
  }
}
