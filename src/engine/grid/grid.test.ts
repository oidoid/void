import {describe, test} from 'node:test'
import {assert} from '../../test/assert.ts'
import type {Anim, Atlas} from '../graphics/atlas.ts'
import type {Sprite} from '../graphics/sprite.ts'
import {SpritePool} from '../mem/sprite-pool.ts'
import {Grid} from './grid.ts'

type TestEnt = {sprite: Sprite}

const anim: Readonly<Anim> = {
  cels: 1,
  id: 0,
  w: 16,
  h: 16,
  hitbox: {x: 0, y: 0, w: 16, h: 16},
  hurtbox: {x: 0, y: 0, w: 16, h: 16}
}

const atlas: Readonly<Atlas> = {
  anim: {'test--Ent': anim},
  celXYWH: [],
  tags: ['test--Ent']
}

test('constructor() initializes grid dimensions', () => {
  const grid = new Grid<TestEnt>({x: 0, y: 0, w: 100, h: 100}, 25, 16)
  assert(grid.x, 0)
  assert(grid.y, 0)
  assert(grid.w, 100)
  assert(grid.h, 100)
})

test('constructor() handles negative bounds', () => {
  const grid = new Grid<TestEnt>({x: -50, y: -50, w: 100, h: 100}, 25, 16)
  assert(grid.x, -50)
  assert(grid.y, -50)
  assert(grid.w, 100)
  assert(grid.h, 100)
})

describe('init()', () => {
  test('places entities in grid', () => {
    const pool = TestPool()
    const grid = new Grid<TestEnt>({x: 0, y: 0, w: 100, h: 100}, 50, 16)
    const ents = [TestEnt(pool, 10, 10), TestEnt(pool, 60, 60)]
    grid.init(ents)
    // no error means success. grid internals are private.
    pool.clear()
  })

  test('handles empty ents array', () => {
    const grid = new Grid<TestEnt>({x: 0, y: 0, w: 100, h: 100}, 50, 16)
    grid.init([])
    assert([...grid.hit()].length, 0)
  })
})

describe('clear()', () => {
  test('empties all cells', () => {
    const pool = TestPool()
    const grid = new Grid<TestEnt>({x: 0, y: 0, w: 100, h: 100}, 50, 16)
    const ents = [TestEnt(pool, 10, 10), TestEnt(pool, 20, 20)]
    grid.init(ents)
    grid.clear()
    // after clear, hit should yield nothing.
    assert([...grid.hit()].length, 0)
    pool.clear()
  })
})

describe('hit()', () => {
  test('yields nothing for non-overlapping entities', () => {
    const pool = TestPool()
    const grid = new Grid<TestEnt>({x: 0, y: 0, w: 100, h: 100}, 50, 16)
    const ents = [
      TestEnt(pool, 0, 0), // hitbox at (0,0) 16x16.
      TestEnt(pool, 50, 50) // hitbox at (50,50) 16x16. no overlap.
    ]
    grid.init(ents)
    const hits = [...grid.hit()]
    assert(hits.length, 0)
    pool.clear()
  })

  test('yields overlapping entity pairs', () => {
    const pool = TestPool()
    const grid = new Grid<TestEnt>({x: 0, y: 0, w: 100, h: 100}, 50, 16)
    const ents = [
      TestEnt(pool, 10, 10), // hitbox at (10,10) 16x16.
      TestEnt(pool, 15, 15) // hitbox at (15,15) 16x16. overlaps.
    ]
    grid.init(ents)
    const hits = [...grid.hit()]
    assert(hits.length, 1)
    assert(hits[0]![0], ents[0])
    assert(hits[0]![1], ents[1])
    pool.clear()
  })

  test('yields multiple collision pairs', () => {
    const pool = TestPool()
    const grid = new Grid<TestEnt>({x: 0, y: 0, w: 100, h: 100}, 50, 16)
    const ents = [
      TestEnt(pool, 10, 10),
      TestEnt(pool, 15, 15), // overlaps with 0.
      TestEnt(pool, 20, 20) // overlaps with 0 and 1.
    ]
    grid.init(ents)
    const hits = [...grid.hit()]
    assert(hits.length, 3)
    pool.clear()
  })

  test('handles entities at grid boundaries', () => {
    const pool = TestPool()
    const grid = new Grid<TestEnt>({x: 0, y: 0, w: 100, h: 100}, 50, 16)
    const ents = [
      TestEnt(pool, 0, 0), // corner.
      TestEnt(pool, 84, 84) // near opposite corner.
    ]
    grid.init(ents)
    const hits = [...grid.hit()]
    assert(hits.length, 0)
    pool.clear()
  })

  test('handles entities outside bounds clamped to edge', () => {
    const pool = TestPool()
    const grid = new Grid<TestEnt>({x: 0, y: 0, w: 100, h: 100}, 50, 16)
    const ents = [
      TestEnt(pool, -100, -100), // clamped to cell 0.
      TestEnt(pool, -95, -95) // also clamped to cell 0. overlaps.
    ]
    grid.init(ents)
    const hits = [...grid.hit()]
    assert(hits.length, 1)
    pool.clear()
  })

  test('handles entities in same cell', () => {
    const pool = TestPool()
    const grid = new Grid<TestEnt>({x: 0, y: 0, w: 100, h: 100}, 50, 16)
    const ents = [
      TestEnt(pool, 25, 25),
      TestEnt(pool, 30, 30) // same cell as 0 and overlaps.
    ]
    grid.init(ents)
    const hits = [...grid.hit()]
    assert(hits.length, 1)
    assert(hits[0]![0], ents[0])
    assert(hits[0]![1], ents[1])
    pool.clear()
  })

  test('handles negative bounds', () => {
    const pool = TestPool()
    const grid = new Grid<TestEnt>({x: -50, y: -50, w: 100, h: 100}, 50, 16)
    const ents = [
      TestEnt(pool, -40, -40),
      TestEnt(pool, -35, -35) // overlaps.
    ]
    grid.init(ents)
    const hits = [...grid.hit()]
    assert(hits.length, 1)
    pool.clear()
  })

  test('cross-cell collision detection', () => {
    const pool = TestPool()
    // 16px entities with 50px cells. radius is ceil(16/50) = 1.
    const grid = new Grid<TestEnt>({x: 0, y: 0, w: 100, h: 100}, 50, 16)
    const ents = [
      TestEnt(pool, 45, 45), // near cell boundary.
      TestEnt(pool, 55, 55) // in adjacent cell but overlaps.
    ]
    grid.init(ents)
    const hits = [...grid.hit()]
    assert(hits.length, 1)
    pool.clear()
  })

  test('no self-collision', () => {
    const pool = TestPool()
    const grid = new Grid<TestEnt>({x: 0, y: 0, w: 100, h: 100}, 50, 16)
    const ents = [TestEnt(pool, 10, 10)]
    grid.init(ents)
    const hits = [...grid.hit()]
    assert(hits.length, 0)
    pool.clear()
  })

  test('yields pairs in init order', () => {
    const pool = TestPool()
    const grid = new Grid<TestEnt>({x: 0, y: 0, w: 100, h: 100}, 50, 16)
    const ents = [
      TestEnt(pool, 10, 10),
      TestEnt(pool, 15, 15),
      TestEnt(pool, 20, 20)
    ]
    grid.init(ents)
    const hits = [...grid.hit()]
    // first entity in each pair should come before second in ents array.
    for (const [a, b] of hits) {
      const iA = ents.indexOf(a)
      const iB = ents.indexOf(b)
      assert(iA < iB, true, `pair should have first ent before second in ents`)
    }
    pool.clear()
  })
})

describe('cell sizing', () => {
  test('small cells with large entities', () => {
    const pool = TestPool()
    // 16px entity, 8px cells. radius = ceil(16/8) = 2.
    const grid = new Grid<TestEnt>({x: 0, y: 0, w: 64, h: 64}, 8, 16)
    const ents = [
      TestEnt(pool, 0, 0),
      TestEnt(pool, 10, 10) // overlaps.
    ]
    grid.init(ents)
    const hits = [...grid.hit()]
    assert(hits.length, 1)
    pool.clear()
  })

  test('large cells with small entities', () => {
    const pool = TestPool()
    // 16px entity, 100px cells. radius = ceil(16/100) = 1.
    const grid = new Grid<TestEnt>({x: 0, y: 0, w: 200, h: 200}, 100, 16)
    const ents = [
      TestEnt(pool, 0, 0),
      TestEnt(pool, 150, 150) // different cells, no overlap.
    ]
    grid.init(ents)
    const hits = [...grid.hit()]
    assert(hits.length, 0)
    pool.clear()
  })
})

function TestPool(): SpritePool {
  return SpritePool({atlas, looper: {age: 0}, pageBlocks: 64})
}

function TestEnt(pool: SpritePool, x: number, y: number): TestEnt {
  const sprite = pool.alloc()
  sprite.tag = 'test--Ent'
  sprite.x = x
  sprite.y = y
  return {sprite}
}
