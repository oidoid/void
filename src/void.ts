import type {Cam} from './cam.ts'
import type {Framer} from './framer.ts'
import type {TagFormat} from './graphics/atlas.ts'
import type {Renderer} from './graphics/renderer.ts'
import type {Sprite} from './graphics/sprite.ts'
import type {Input} from './input/input.ts'
import type {Pool} from './mem/pool.ts'
import type {Debug} from './types/debug.ts'

declare global {
  var v: Void<string, TagFormat>
}

export type Void<Button extends string, Tag extends TagFormat> = {
  cam: Cam
  debug: Debug | undefined
  framer: Framer
  input: Input<Button>
  pool: Pool<Sprite<Tag>>
  renderer: Renderer
}
