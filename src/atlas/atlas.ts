import type {Anim, AnimTag} from './anim.js'

export type Atlas<T extends AnimTag = AnimTag> = {
  readonly [tag in T]: Anim<T>
}
