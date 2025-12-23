import type {Sprite} from '../graphics/sprite.ts'
import type {Pool} from './pool.ts'

export interface PoolMap {
  default: Pool<Sprite>
}
