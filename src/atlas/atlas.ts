import type {Anim, AnimTagFormat} from './anim.js'

export type Atlas<T extends AnimTagFormat = AnimTagFormat> = {
  readonly [tag in T]: Anim<T>
}
