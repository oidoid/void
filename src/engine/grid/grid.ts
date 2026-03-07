import type {Collide} from '../ents/collide.ts'
import type {WH, XY} from '../types/geo.ts'
import type {Void} from '../void.ts'

export type GridEnt = {sprite: XY}

export type GridOpts = {
  /** width and height of each cell. must be >= maximum sprite size. */
  cellSize: number
  wh: WH
  xy: XY
}

export class Grid<Ent extends GridEnt> {
  readonly #cellSize: number
  readonly #cells: Ent[][][] = []
  readonly #cols: number
  readonly #halfCellSize: number
  readonly #rows: number
  readonly #xy: Readonly<XY>

  constructor(opts: Readonly<GridOpts>) {
    this.#cellSize = opts.cellSize
    this.#halfCellSize = opts.cellSize / 2
    this.#xy = {...opts.xy}
    this.#cols = Math.ceil(opts.wh.w / opts.cellSize)
    this.#rows = Math.ceil(opts.wh.h / opts.cellSize)
  }

  insert(ent: Ent): void {
    const col = Math.floor(
      (ent.sprite.x - this.#xy.x + this.#halfCellSize) / this.#cellSize
    )
    const row = Math.floor(
      (ent.sprite.y - this.#xy.y + this.#halfCellSize) / this.#cellSize
    )
    if (row < 0 || row >= this.#rows || col < 0 || col >= this.#cols) return
    this.#cells[row] ??= []
    this.#cells[row]![col] ??= []
    this.#cells[row]![col]!.push(ent)
  }

  forEachCollision(collide: Collide<Ent>, v: Void): void {
    for (let row = 0; row < this.#rows; row++)
      for (let col = 0; col < this.#cols; col++) {
        const cell = this.#cells[row]?.[col]
        if (!cell?.length) continue

        // intra-cell pairs.
        for (let a = 0; a < cell.length; a++)
          for (let b = a + 1; b < cell.length; b++)
            collide(cell[a]!, cell[b]!, v)

        // forward neighbor cells.
        const right = this.#cells[row]?.[col + 1]
        if (right?.length) collideNeighborCells(cell, right, collide, v)

        const downLeft = this.#cells[row + 1]?.[col - 1]
        if (downLeft?.length) collideNeighborCells(cell, downLeft, collide, v)

        const down = this.#cells[row + 1]?.[col]
        if (down?.length) collideNeighborCells(cell, down, collide, v)

        const downRight = this.#cells[row + 1]?.[col + 1]
        if (downRight?.length) collideNeighborCells(cell, downRight, collide, v)
      }
  }
}

function collideNeighborCells<Ent>(
  cell: readonly Ent[],
  neighbor: readonly Ent[],
  collide: Collide<Ent>,
  v: Void
): void {
  for (let a = 0; a < cell.length; a++)
    for (let b = 0; b < neighbor.length; b++) collide(cell[a]!, neighbor[b]!, v)
}
