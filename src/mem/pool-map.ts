import type {AnyTag} from '../graphics/atlas.ts'
import type {Sprite} from '../graphics/sprite.ts'
import type {Pool} from './pool.ts'

export interface PoolMap<Tag extends AnyTag> {
  default: Pool<Sprite<Tag>>
}
