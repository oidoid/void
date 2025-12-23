import type {AnyTag, Atlas} from '../graphics/atlas.ts'
import {drawableBytes, Sprite} from '../graphics/sprite.ts'
import type {Millis} from '../types/time.ts'
import {Pool, type PoolOpts} from './pool.ts'

export type SpritePoolOpts<Tag extends AnyTag> = {
  atlas: Atlas<Tag>
  looper: {age: Millis}
} & Omit<PoolOpts<Sprite<Tag>>, 'alloc' | 'allocBytes' | 'init'>

export function SpritePool<Tag extends AnyTag>(
  opts: Readonly<SpritePoolOpts<Tag>>
): Pool<Sprite<Tag>> {
  return new Pool({
    alloc: pool => new Sprite(pool, 0, opts.atlas, opts.looper),
    init: sprite => sprite.init(),
    allocBytes: drawableBytes,
    ...opts
  })
}
