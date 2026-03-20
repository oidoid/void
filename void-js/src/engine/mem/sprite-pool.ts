import type {Atlas} from '../graphics/atlas.ts'
import {Sprite, spriteBytes} from '../graphics/sprite.ts'
import type {Millis} from '../types/time.ts'
import {Pool, type PoolOpts} from './pool.ts'

export type SpritePool = Pool<Sprite>

export type SpritePoolOpts = {
  atlas: Atlas
  looper: {age: Millis}
} & Omit<PoolOpts<Sprite>, 'alloc' | 'allocBytes' | 'init'>

export function SpritePool(opts: Readonly<SpritePoolOpts>): SpritePool {
  return new Pool({
    alloc: pool => new Sprite(pool, 0, opts.atlas, opts.looper),
    init: sprite => sprite.init(),
    allocBytes: spriteBytes,
    ...opts
  })
}
