import type * as V from '../../index.ts'

export type DrawEnt = V.SysEnt<DrawSys>

export class DrawSys implements V.Sys {
  readonly query = 'draw' as const

  update(_ent: DrawEnt, v: V.Void): void {
    const render =
      v.zoo.invalid || v.cam.invalid || v.renderer.invalid || v.renderer.always
    if (render) {
      v.renderer.clear(v.backgroundRGBA)
      v.renderer.predraw(v.cam)
      v.renderer.setDepth(true)
      v.renderer.draw(v.pool.default)
      v.renderer.setDepth(false)
      v.renderer.draw(v.pool.overlay)
    }
  }
}
