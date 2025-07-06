import type { Millis } from '../types/time.ts'
import type { Atlas, TagFormat } from './atlas.ts'
import { sizeofDrawable, Sprite } from './sprite.ts'

export class SpriteBuffer<T extends TagFormat = TagFormat> {
  readonly #atlas: Atlas<T>
  readonly #framer: {readonly age: Millis}
  #size: number = 0
  readonly #sprites: Sprite<T>[] = []
  readonly #view: DataView<ArrayBuffer>

  constructor(
    atlas: Atlas<T>,
    framer: {readonly age: Millis},
    initCapacity: number = 128,
    maxCapacity: number = 1024 * 1024
  ) {
    this.#atlas = atlas
    this.#framer = framer
    this.#view = new DataView(
      new ArrayBuffer(initCapacity * sizeofDrawable, {
        maxByteLength: maxCapacity * sizeofDrawable
      })
    )
    for (let i = 0; i < this.capacity; i++)
      this.#sprites.push(new Sprite(this.#view, i, this.#atlas, this.#framer))
  }

  alloc(): Sprite<T> {
    if (this.#size === this.#view.byteLength / sizeofDrawable) {
      if (this.#view.byteLength === this.#view.buffer.maxByteLength)
        throw Error(`sprite buffer overflow capacity=${this.capacity}`)
      this.#view.buffer.resize(
        Math.min(this.#view.byteLength * 2, this.#view.buffer.maxByteLength)
      )
      for (let i = this.#size; i < this.capacity; i++)
        this.#sprites.push(new Sprite(this.#view, i, this.#atlas, this.#framer))
    }
    const sprite = this.#sprites[this.#size]!
    this.#size++
    return sprite
  }

  get capacity(): number {
    return this.#view.byteLength / sizeofDrawable
  }

  free(sprite: Sprite<T>): void {}
}
