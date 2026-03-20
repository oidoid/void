import {describe, test} from 'node:test'
import {assert} from '../../test/assert.ts'
import type {LevelTiles, Tileset} from './tileset.ts'
import {tileAt, tileIDAt} from './tileset.ts'

const tileWH = {w: 16, h: 16}

describe('tileIDAt() zero origin', () => {
  // 2x2 grid at origin (0,0), 32x32 pixels.
  //   0 1
  //   2 3
  const level: Readonly<LevelTiles> = {
    x: 0,
    y: 0,
    w: 32,
    h: 32,
    tiles: [0, 1, 2, 3]
  }

  for (const [name, xy, id] of [
    ['origin', {x: 0, y: 0}, 0],
    ['within first tile', {x: 15, y: 15}, 0],
    ['second column', {x: 16, y: 0}, 1],
    ['second row', {x: 0, y: 16}, 2],
    ['last tile', {x: 16, y: 16}, 3],
    ['last tile edge pixel', {x: 31, y: 31}, 3],
    ['past right edge', {x: 32, y: 0}, undefined],
    ['past bottom edge', {x: 0, y: 32}, undefined],
    ['negative x', {x: -1, y: 0}, undefined],
    ['negative y', {x: 0, y: -1}, undefined]
  ] as const)
    test(`tileIDAt() ${xy.x},${xy.y} ${name}`, () =>
      assert(tileIDAt(level, xy, tileWH), id))
})

describe('tileIDAt() nonzero origin', () => {
  const offset: Readonly<LevelTiles> = {
    x: 64,
    y: 128,
    w: 32,
    h: 32,
    tiles: [10, 11, 12, 13]
  }
  for (const [name, xy, tile] of [
    ['top-left', {x: 64, y: 128}, 10],
    ['top-right', {x: 80, y: 128}, 11],
    ['bottom-left', {x: 64, y: 144}, 12],
    ['bottom-right', {x: 80, y: 144}, 13],
    ['past left edge', {x: 63, y: 128}, undefined],
    ['past right edge', {x: 96, y: 128}, undefined]
  ] as const)
    test(`tileIDAt() ${xy.x},${xy.y} ${name}`, () =>
      assert(tileIDAt(offset, xy, tileWH), tile))
})

describe('tileAt()', () => {
  // 2x2 grid at origin (0,0), 32x32 pixels.
  //   0 1
  //   2 3
  const level: Readonly<LevelTiles> = {
    x: 0,
    y: 0,
    w: 32,
    h: 32,
    tiles: [0, 1, 2, 3]
  }
  const tileset: Readonly<Tileset> = {
    tiles: ['void--Nil', 'foo--Bar', 'baz--Qux', 'a--B'],
    tileWH: {w: 16, h: 16}
  }

  for (const [name, xy, tile] of [
    ['top-left', {x: 0, y: 0}, 'void--Nil'],
    ['top-right', {x: 16, y: 0}, 'foo--Bar'],
    ['bottom-left', {x: 0, y: 16}, 'baz--Qux'],
    ['bottom-right', {x: 16, y: 16}, 'a--B'],
    ['out of bounds negative', {x: -1, y: 0}, undefined],
    ['out of bounds past edge', {x: 32, y: 0}, undefined]
  ] as const) {
    test(`tileAt() ${xy.x},${xy.y} ${name}`, () =>
      assert(tileAt(tileset, level, xy), tile))
  }
})
