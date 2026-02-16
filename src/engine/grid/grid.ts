import type {SpriteEnt} from '../ents/sprite.ts'
import type {Box, XY} from '../types/geo.ts'

export class Grid<Ent extends SpriteEnt> implements Box {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number

  readonly #cellSize: number
  readonly #cells: Set<number>[]
  readonly #cols: number
  #ents: readonly Readonly<Ent>[] = []
  readonly #entSize: number
  readonly #offset: Readonly<XY>
  readonly #rows: number

  constructor(bounds: Readonly<Box>, cellSize: number, entSize: number) {
    this.x = bounds.x
    this.y = bounds.y
    this.w = bounds.w
    this.h = bounds.h
    this.#cellSize = cellSize
    this.#entSize = entSize
    this.#offset = {x: entSize / 2 - bounds.x, y: entSize / 2 - bounds.y}
    this.#cols = Math.ceil(this.w / cellSize)
    this.#rows = Math.ceil(this.h / cellSize)
    this.#cells = new Array(this.#cols * this.#rows)
    for (let i = 0; i < this.#cells.length; i++) this.#cells[i] = new Set()
  }

  init(ents: readonly Readonly<Ent>[]): void {
    this.#ents = ents
    for (let i = 0; i < ents.length; i++)
      this.#cells[this.#cellIndex(ents[i]!.sprite)]!.add(i)
  }

  clear(): void {
    // to-do: just dispose grid? this takes forever.
    for (const cell of this.#cells) cell.clear()
    this.#ents = []
  }

  *hit(): IterableIterator<[Ent, Ent]> {
    const radius = Math.ceil(this.#entSize / this.#cellSize)

    for (let i = 0; i < this.#ents.length; i++) {
      const ent = this.#ents[i]!
      const col = Math.max(
        0,
        Math.min(
          this.#cols - 1,
          ((ent.sprite.x + this.#offset.x) / this.#cellSize) | 0
        )
      )
      const row = Math.max(
        0,
        Math.min(
          this.#rows - 1,
          ((ent.sprite.y + this.#offset.y) / this.#cellSize) | 0
        )
      )

      const rMin = Math.max(0, row - radius)
      const rMax = Math.min(this.#rows - 1, row + radius)
      const cMin = Math.max(0, col - radius)
      const cMax = Math.min(this.#cols - 1, col + radius)

      for (let r = rMin; r <= rMax; r++) {
        const rowOffset = r * this.#cols
        for (let c = cMin; c <= cMax; c++) {
          for (const j of this.#cells[rowOffset + c]!) {
            if (j <= i) continue
            const other = this.#ents[j]!
            if (ent.sprite.hits(other.sprite)) yield [ent, other]
          }
        }
      }
    }
  }

  #cellIndex(xy: Readonly<XY>): number {
    const col = Math.max(
      0,
      Math.min(this.#cols - 1, ((xy.x + this.#offset.x) / this.#cellSize) | 0)
    )
    const row = Math.max(
      0,
      Math.min(this.#rows - 1, ((xy.y + this.#offset.y) / this.#cellSize) | 0)
    )
    return row * this.#cols + col
  }
}
