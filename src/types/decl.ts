import type {AnimTag} from '../graphics/atlas.ts'

declare module '../graphics/sprite.ts' {
  interface Sprite {
    getTag(): AnimTag
    setTag(tag: AnimTag): void
  }
}
