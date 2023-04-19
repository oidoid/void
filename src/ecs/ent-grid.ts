import { Box, XY } from '@/ooz'
import { SpriteEnt } from '@/void'

// to-do: probably need to handle WH changes of sprites.
export class EntGrid {
  readonly #bounds: Readonly<Box>
  readonly #cellWH: Readonly<XY>
  readonly #grid: readonly (readonly Set<SpriteEnt>[])[]
  readonly #gridMax: Readonly<XY>

  /** World and cell size. Cel size does not need to be an even multiple. */
  constructor(bounds: Readonly<Box>, cellWH: Readonly<XY>) {
    const grid: Set<SpriteEnt>[][] = []
    this.#gridMax = bounds.xy.copy().abs().add(bounds.wh).div(cellWH).ceil()
    for (let y = 0; y <= this.#gridMax.y; y++) {
      grid[y] = []
      for (let x = 0; x <= this.#gridMax.x; x++) grid[y]![x] = new Set()
    }
    this.#grid = grid
    this.#bounds = bounds
    this.#cellWH = cellWH
  }

  add(ent: SpriteEnt): void {
    const min = this.#boundsGridMin(ent.sprites[0].bounds)
    const max = this.#boundsGridMax(ent.sprites[0].bounds)
    for (let y = min.y; y <= max.y; y++) {
      for (let x = min.x; x <= max.x; x++) this.#grid[y]![x]!.add(ent)
    }
  }

  // results may be larger than bounds. an intersection test is necessary if
  // strict boundaries are wanted. results are unique
  *query(bounds: Readonly<Box>): IterableIterator<SpriteEnt> {
    const results = new Set()
    const min = this.#boundsGridMin(bounds)
    const max = this.#boundsGridMax(bounds)
    for (let y = min.y; y <= max.y; y++) {
      for (let x = min.x; x <= max.x; x++) {
        for (const ent of this.#grid[y]![x]!) {
          if (results.has(ent)) continue
          results.add(ent)
          yield ent
        }
      }
    }
  }

  remove(ent: Readonly<SpriteEnt>): void {
    const min = this.#boundsGridMin(ent.sprites[0].bounds)
    const max = this.#boundsGridMax(ent.sprites[0].bounds)
    for (let y = min.y; y <= max.y; y++) {
      for (let x = min.x; x <= max.x; x++) this.#grid[y]![x]!.delete(ent)
    }
  }

  #boundsGridMax(bounds: Readonly<Box>): XY {
    // Bounds is inclusive. Taking the ceil is erroneous.
    return bounds.end.sub(this.#bounds.xy).div(this.#cellWH).min(this.#gridMax)
      .trunc()
  }

  #boundsGridMin(bounds: Readonly<Box>): XY {
    return bounds.xy.copy().sub(this.#bounds.xy).div(this.#cellWH).max(0, 0)
      .trunc()
  }
}
