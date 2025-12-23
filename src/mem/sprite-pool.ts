import type {Atlas} from '../graphics/atlas.ts'
import {drawableBytes, Sprite} from '../graphics/sprite.ts'
import type {Millis} from '../types/time.ts'
import {Pool, type PoolOpts} from './pool.ts'

export type SpritePoolOpts = {
  atlas: Atlas
  looper: {age: Millis}
} & Omit<PoolOpts<Sprite>, 'alloc' | 'allocBytes' | 'init'>

export function SpritePool(opts: Readonly<SpritePoolOpts>): Pool<Sprite> {
  return new Pool({
    alloc: pool => new Sprite(pool, 0, opts.atlas, opts.looper),
    init: sprite => sprite.init(),
    allocBytes: drawableBytes,
    ...opts
  })
}
