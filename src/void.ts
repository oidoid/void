import type {Framer} from './framer.ts'
import type {TagFormat} from './graphics/atlas.ts'
import type {Cam} from './graphics/cam.ts'
import type {Renderer} from './graphics/renderer.ts'
import type {Sprite} from './graphics/sprite.ts'
import type {Input} from './input/input.ts'
import type {Pool} from './mem/pool.ts'
import type {Debug} from './types/debug.ts'

/** declaration merge input and pool. */
export interface Void {
  cam: Cam
  canvas: HTMLCanvasElement
  debug: Debug | undefined
  framer: Framer
  renderer: Renderer
}

// to-do: do this typing for Atlas and Sprite too so everything is implied when
//        Void is used over VoidT.
export type VoidT<Button extends string, Tag extends TagFormat> = Omit<
  Void,
  'input' | 'pool'
> & {
  input: Input<Button>
  pool: Pool<Sprite<Tag>>
}
