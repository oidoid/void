import {describe, test} from 'node:test'
import {assert} from '../../test/assert.ts'
import type {Atlas} from '../graphics/atlas.ts'
import {Layer} from '../graphics/layer.ts'
import type {Input} from '../input/input.ts'
import {SpritePool} from '../mem/sprite-pool.ts'
import type {XY} from '../types/geo.ts'
import type {Secs} from '../types/time.ts'
import type {CursorEnt} from './cursor.ts'
import {onKey, onPoint} from './cursor.ts'

describe('onPoint()', () => {
  test('sets sprite position from pointer local', () => {
    const ent = TestCursorEnt()
    onPoint(ent, {local: {x: 100, y: 200}, type: 'Mouse', click: undefined})
    assert(ent.sprite.x, 100)
    assert(ent.sprite.y, 200)
    assert(ent.sprite.z, Layer.Top)
    assert(ent.invalid, true)
  })

  test('visible for Mouse', () => {
    const ent = TestCursorEnt()
    onPoint(ent, {local: {x: 0, y: 0}, type: 'Mouse', click: undefined})
    assert(ent.sprite.hidden, false)
  })

  test('hidden for Touch', () => {
    const ent = TestCursorEnt()
    onPoint(ent, {local: {x: 0, y: 0}, type: 'Touch', click: undefined})
    assert(ent.sprite.hidden, true)
  })
})

describe('onKey()', () => {
  test('clamps to bounds.x min', () => {
    const ent = TestCursorEnt({keyboard: 100})
    ent.cursor.bounds = {x: 10, y: 0, w: 100, h: 100}
    ent.sprite.x = 15
    onKey(ent, TestInput({dir: {x: -1, y: 0}}), 1 as Secs)
    assert(ent.sprite.x, 10)
  })

  test('clamps to bounds.x max', () => {
    const ent = TestCursorEnt({keyboard: 100})
    ent.cursor.bounds = {x: 0, y: 0, w: 50, h: 100}
    ent.sprite.x = 45
    onKey(ent, TestInput({dir: {x: 1, y: 0}}), 1 as Secs)
    assert(ent.sprite.x, 50)
  })

  test('clamps to bounds.y min', () => {
    const ent = TestCursorEnt({keyboard: 100})
    ent.cursor.bounds = {x: 0, y: 10, w: 100, h: 100}
    ent.sprite.y = 15
    onKey(ent, TestInput({dir: {x: 0, y: -1}}), 1 as Secs)
    assert(ent.sprite.y, 10)
  })

  test('clamps to bounds.y max', () => {
    const ent = TestCursorEnt({keyboard: 100})
    ent.cursor.bounds = {x: 0, y: 0, w: 100, h: 50}
    ent.sprite.y = 45
    onKey(ent, TestInput({dir: {x: 0, y: 1}}), 1 as Secs)
    assert(ent.sprite.y, 50)
  })

  test('sets visible', () => {
    const ent = TestCursorEnt({keyboard: 100})
    ent.sprite.hidden = true
    onKey(ent, TestInput({dir: {x: 1, y: 0}}), 0.1 as Secs)
    assert(ent.sprite.hidden, false)
    assert(ent.invalid, true)
  })
})

function TestCursorEnt(opts?: {keyboard?: number}): CursorEnt {
  const atlas: Atlas = {
    anim: {'stem--point': {cels: 1, id: 0, w: 8, h: 8}},
    celXYWH: [],
    tags: ['stem--point']
  }
  const pool = SpritePool({atlas, looper: {age: 0}, pageBlocks: 4})
  const sprite = pool.alloc()
  sprite.tag = 'stem--point'
  sprite.w = 8
  sprite.h = 8
  return {
    cursor: {
      bounds: {x: -100, y: -100, w: 1000, h: 1000},
      keyboard: opts?.keyboard ?? 0,
      point: 'stem--point'
    },
    sprite,
    invalid: false
  }
}

function TestInput(opts: {
  readonly dir?: Readonly<XY>
  readonly isOn?: () => boolean
  readonly isAnyOnStart?: () => boolean
}): Input {
  return {
    dir: opts.dir ?? {x: 0, y: 0},
    handled: false,
    isOn: opts.isOn ?? (() => false),
    isAnyOnStart: opts.isAnyOnStart ?? (() => false)
  } as unknown as Input
}
