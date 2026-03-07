import {describe, test} from 'node:test'
import {assert} from '../../test/assert.ts'
import type {Void} from '../void.ts'
import {Grid, type GridEnt, type GridOpts} from './grid.ts'

const opts: Readonly<GridOpts> = {
  cellSize: 10,
  xy: {x: -45, y: -45},
  wh: {w: 100, h: 100}
}

describe('insert()', () => {
  test('empty grid yields no pairs', () => {
    const grid = new Grid(opts)
    assert(pairs(grid), [])
  })

  test('single ent yields no pairs', () => {
    const grid = new Grid(opts)
    grid.insert(Ent(5, 5))
    assert(pairs(grid), [])
  })

  test('out-of-bounds ents are dropped', () => {
    const grid = new Grid(opts)
    grid.insert(Ent(200, 200))
    grid.insert(Ent(200, 200))
    grid.insert(Ent(200, 200))
    grid.insert(Ent(200, 200))
    assert(pairs(grid), [])
  })

  test('negative-coord ents are dropped', () => {
    const grid = new Grid(opts)
    grid.insert(Ent(-1, -1))
    assert(pairs(grid), [])
  })
})

describe('forEachCollision()', () => {
  describe('same cell', () => {
    test('two ents produce one pair', () => {
      const grid = new Grid(opts)
      const a = Ent(5, 5)
      const b = Ent(6, 6)
      grid.insert(a)
      grid.insert(b)
      assert(pairs(grid), [[a, b]])
    })

    test('three ents produce three pairs', () => {
      const grid = new Grid(opts)
      const a = Ent(5, 5)
      const b = Ent(6, 6)
      const c = Ent(7, 7)
      grid.insert(a)
      grid.insert(b)
      grid.insert(c)
      assert(pairs(grid), [
        [a, b],
        [a, c],
        [b, c]
      ])
    })
  })

  describe('adjacent cells', () => {
    for (const [name, bx, by] of [
      ['(4, 4) above-left', -5, -5],
      ['(4, 5) above', 5, -5],
      ['(4, 6) above-right', 15, -5],
      ['(5, 4) left', -5, 5],
      ['(5, 5) same', 5, 5],
      ['(5, 6) right', 15, 5],
      ['(6, 4) below-left', -5, 15],
      ['(6, 5) below', 5, 15],
      ['(6, 6) below-right', 15, 15]
    ] as const) {
      test(`A in cell (5, 5), B in cell ${name}`, () => {
        const grid = new Grid(opts)
        const a = Ent(5, 5) // cell (5, 5).
        const b = Ent(bx, by)
        grid.insert(a)
        grid.insert(b)
        assert(pairs(grid).length, 1)
      })
    }
  })

  describe('no spurious pairs', () => {
    test('ents two cells apart produce no pairs', () => {
      const grid = new Grid(opts)
      grid.insert(Ent(5, 5)) // cell (5, 5).
      grid.insert(Ent(25, 5)) // cell (5, 7).
      assert(pairs(grid), [])
    })

    test('16 border cells of 5×5 neighborhood produce no pairs with A', () => {
      // A in cell (5, 5). border cells are those at row or col 3 or 7, two
      // cells away, and should never pair with A.
      //                            row
      //      ┌───┬───┬───┬───┬───┐
      //      │ · │ · │ · │ · │ · │ 3
      //      ├───┼───┼───┼───┼───┤
      //      │ · │   │   │   │ · │ 4
      //      ├───┼───┼───┼───┼───┤
      //      │ · │   │ A │   │ · │ 5
      //      ├───┼───┼───┼───┼───┤
      //      │ · │   │   │   │ · │ 6
      //      ├───┼───┼───┼───┼───┤
      //      │ · │ · │ · │ · │ · │ 7
      //      └───┴───┴───┴───┴───┘
      //  col   3   4   5   6   7
      const grid = new Grid(opts)
      const borderXYs: [number, number][] = [
        [-15, -15],
        [-5, -15],
        [5, -15],
        [15, -15],
        [25, -15], // row 3
        [-15, -5],
        [-15, 5],
        [-15, 15], // col 3
        [25, -5],
        [25, 5],
        [25, 15], // col 7
        [-15, 25],
        [-5, 25],
        [5, 25],
        [15, 25],
        [25, 25] // row 7
      ]
      assert(borderXYs.length, 16)
      for (const [x, y] of borderXYs) grid.insert(Ent(x, y))
      const a = Ent(5, 5) // cell (5, 5).
      grid.insert(a)
      const result = pairs(grid)
      assert(
        result.every(([hitA, hitB]) => hitA !== a && hitB !== a),
        true
      )
    })

    test('each pair reported exactly once', () => {
      const grid = new Grid(opts)
      const a = Ent(5, 5)
      const b = Ent(14, 5) // cell (5, 6).
      const c = Ent(15, 5) // cell (5, 6).
      grid.insert(a)
      grid.insert(b)
      grid.insert(c)
      const result = pairs(grid)
      assert(result.length, 3)
    })

    test('nonzero origin shifts bucketing correctly', () => {
      const grid = new Grid({
        xy: {x: 50, y: 50},
        wh: {w: 100, h: 100},
        cellSize: 10
      })
      const a = Ent(55, 55) // cell (1, 1).
      const b = Ent(65, 55) // cell (1, 2). adjacent.
      const c = Ent(80, 55) // cell (1, 3). two away from a.
      grid.insert(a)
      grid.insert(b)
      grid.insert(c)
      const result = pairs(grid)
      // a-b adjacent, b-c adjacent, a-c two apart
      assert(result.length, 2)
    })

    test('4x4 grid one ent per cell, each pair reported exactly once', () => {
      // cell layout (row-major):
      //  0  1  2  3
      //  4  5  6  7
      //  8  9  a  b
      //  c  d  e  f
      // scenario: when processing cell 5 we check 5 vs 6, 8, 9, a (forward
      // neighbors). when we later process cell 9 its forward neighbors are a,
      // c, d, e; not 5. so (5, 9) must appear exactly once.
      const grid = new Grid({
        xy: {x: 0, y: 0},
        wh: {w: 40, h: 40},
        cellSize: 10
      })
      const ents = Array.from({length: 16}, (_, i) => {
        const col = i % 4
        const row = Math.floor(i / 4)
        return Ent(col * 10, row * 10)
      })
      for (const e of ents) grid.insert(e)

      const result = pairs(grid)

      // no pair (a, b) or (b, a) should appear more than once.
      const seen = new Set<string>()
      for (const [a, b] of result) {
        const ia = ents.indexOf(a)
        const ib = ents.indexOf(b)
        const key = `${Math.min(ia, ib)},${Math.max(ia, ib)}`
        assert(seen.has(key), false)
        seen.add(key)
      }

      // (5, 9) appears exactly once.
      const e5 = ents[5]!
      const e9 = ents[9]!
      const count59 = result.filter(
        ([a, b]) => (a === e5 && b === e9) || (a === e9 && b === e5)
      ).length
      assert(count59, 1)

      // 12 right + 12 below + 9 below-right + 9 below-left = 42 total pairs.
      assert(result.length, 42)
    })
  })
})

function Ent(x: number, y: number) {
  return {sprite: {x, y}}
}

function pairs(grid: Readonly<Grid<GridEnt>>): [GridEnt, GridEnt][] {
  const pairs: [GridEnt, GridEnt][] = []
  grid.forEachCollision((a, b) => pairs.push([a, b]), {} as Void)
  return pairs
}
