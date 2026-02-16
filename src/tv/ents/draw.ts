import type * as V from '../../engine/index.ts'

export class DrawHook implements V.Hook {
  readonly query = 'draw'

  update(_ent: V.DrawEnt, v: V.Void): void {
    if (!v.invalid) return
    v.renderer.clear(v.backgroundRGBA)
    v.renderer.predraw(v.cam)
    v.renderer.setDepth(false)
    v.renderer.drawTiles(v.cam)
    v.renderer.setDepth(true)
    v.renderer.drawSprites(v.pool.default)
  }
}
