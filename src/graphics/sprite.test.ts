import {describe, test} from 'node:test'
import {SpritePool} from '../mem/sprite-pool.ts'
import {assert} from '../test/assert.ts'
import type {XY} from '../types/geo.ts'
import type {Millis} from '../types/time.ts'
import {type Anim, type Atlas, animCels, celMillis} from './atlas.ts'
import {Layer} from './layer.ts'
import {diagonalize, floorSpriteEpsilon, Sprite} from './sprite.ts'

const animA: Readonly<Anim> = {
  cels: 10,
  id: 0,
  w: 10,
  h: 20,
  hitbox: {x: 1, y: 2, w: 3, h: 4},
  hurtbox: {x: 1, y: 2, w: 3, h: 4}
}
const animB: Readonly<Anim> = {
  cels: animCels,
  id: 1,
  w: 30,
  h: 40,
  hitbox: {x: 1, y: 2, w: 3, h: 4},
  hurtbox: {x: 1, y: 2, w: 3, h: 4}
}

const atlas: Readonly<Atlas> = {
  anim: {'stem--AnimA': animA, 'stem--AnimB': animB},
  celXYWH: [],
  tags: ['stem--AnimA', 'stem--AnimB']
}

test('above() layer', () => {
  const l = TestSprite()
  const r = TestSprite()

  l.z = 1
  r.z = 2
  assert(l.above(r), false)
  assert(r.above(l), true)

  l.z = 2
  r.z = 2
  assert(l.above(r), false)
  assert(r.above(l), false)

  l.z = 3
  r.z = 2
  assert(l.above(r), true)
  assert(r.above(l), false)
})

test('above() zend', () => {
  const l = TestSprite()
  const r = TestSprite()

  l.h = 10
  r.h = 100
  assert(l.above(r), false)
  assert(r.above(l), false)

  l.zend = true
  assert(l.above(r), true)
  assert(r.above(l), false)

  r.zend = true
  assert(l.above(r), false)
  assert(r.above(l), true)
})

test('angle', () => {
  const pool = TestPool()
  const sprite = TestSprite(pool, 0)

  assert(sprite.angle, 0)
  assert(toHex(pool), '00000000000000000000000000000000')

  sprite.angle = 90
  assert(sprite.angle, 90)
  assert(toHex(pool), '00000000000000000000000000000400')

  sprite.angle = 180
  assert(sprite.angle, 180)
  assert(toHex(pool), '00000000000000000000000000000800')

  sprite.angle = 270
  assert(sprite.angle, 270)
  assert(toHex(pool), '00000000000000000000000000000c00')

  sprite.angle = 359.912109375 // max representable (4095).
  assert(sprite.angle, 359.912109375)
  assert(toHex(pool), '00000000000000000000000000ff0f00')

  sprite.angle = 360
  assert(sprite.angle, 0) // wraps.
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('cel', () => {
  const pool = TestPool()
  const sprite = TestSprite(pool, 0)

  assert(sprite.cel, 0)
  assert(toHex(pool), '00000000000000000000000000000000')

  sprite.cel = 1
  assert(sprite.cel, 1)
  assert(toHex(pool), '00000000000000000000010000000000')

  sprite.cel = animCels
  assert(sprite.cel, animCels)
  assert(toHex(pool), '00000000000000000000100000000000')

  sprite.cel = animCels * 2 - 1
  assert(sprite.cel, animCels * 2 - 1)
  assert(toHex(pool), '000000000000000000001f0000000000')

  sprite.cel = animCels * 2
  assert(sprite.cel, 0)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('clips()', () => {
  const sprite = TestSprite()
  assert(sprite.clips({x: 1, y: 1}), false)

  sprite.w = sprite.h = 10
  assert(sprite.clips({x: 1, y: 1}), true)

  assert(sprite.clips({x: 11, y: 11}), false)
})

describe('clipsZ()', () => {
  test('same layer type delegates to clips()', () => {
    const a = TestSprite()
    const b = TestSprite()
    a.tag = 'stem--AnimA'
    b.tag = 'stem--AnimA'
    a.z = Layer.A
    b.z = Layer.B
    const cam = {x: 100, y: 100}

    assert(a.clipsZ(b, cam), true)
    assert(b.clipsZ(a, cam), true)
  })

  test('different layer types adjusts for cam', () => {
    const world = TestSprite()
    world.tag = 'stem--AnimA'
    world.z = Layer.A
    const ui = TestSprite()
    ui.tag = 'stem--AnimA'
    ui.z = Layer.UIA
    const cam = {x: 50, y: 50}

    assert(world.clipsZ(ui, cam), false)
    assert(ui.clipsZ(world, cam), false)

    world.x = 50
    world.y = 50
    assert(world.clipsZ(ui, cam), true)
    assert(ui.clipsZ(world, cam), true)
  })

  test('UI checking world adjusts with negative offset', () => {
    const world = TestSprite()
    world.tag = 'stem--AnimA'
    world.z = Layer.A
    const ui = TestSprite()
    ui.tag = 'stem--AnimA'
    ui.z = Layer.UIA
    const cam = {x: 50, y: 50}

    assert(ui.clipsZ(world, cam), false)
    assert(world.clipsZ(ui, cam), false)

    ui.x = -50
    ui.y = -50
    assert(ui.clipsZ(world, cam), true)
    assert(world.clipsZ(ui, cam), true)
  })
})

test('flipX', () => {
  const pool = TestPool()
  const sprite = TestSprite(pool, 0)

  assert(sprite.flipX, false)
  assert(toHex(pool), '00000000000000000000000000000000')

  sprite.flipX = true
  assert(sprite.flipX, true)
  assert(toHex(pool), '00000000000040000000000000000000')

  sprite.flipX = false
  assert(sprite.flipX, false)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('flipY', () => {
  const pool = TestPool()
  const sprite = TestSprite(pool, 0)

  assert(sprite.flipY, false)
  assert(toHex(pool), '00000000000000000000000000000000')

  sprite.flipY = true
  assert(sprite.flipY, true)
  assert(toHex(pool), '00000000000020000000000000000000')

  sprite.flipY = false
  assert(sprite.flipY, false)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('height', () => {
  const pool = TestPool()
  const sprite = TestSprite(pool, 0)

  assert(sprite.h, 0)
  assert(toHex(pool), '00000000000000000000000000000000')

  sprite.h = 1
  assert(sprite.h, 1)
  assert(toHex(pool), '00000000000000001000000000000000')

  sprite.h = 1024
  assert(sprite.h, 1024)
  assert(toHex(pool), '00000000000000000040000000000000')

  sprite.h = 4095
  assert(sprite.h, 4095)
  assert(toHex(pool), '0000000000000000f0ff000000000000')

  sprite.h = 4096
  assert(sprite.h, 0)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('index', () => {
  const sprite = TestSprite()

  assert(sprite.i, 0)

  sprite.i = 1
  assert(sprite.i, 1)
})

test('init()', () => {
  const pool = TestPool()
  const sprite = TestSprite(pool, 0)

  sprite.cel = 5
  sprite.flipX = true
  sprite.flipY = true
  sprite.h = 100
  sprite.id = 42
  sprite.stretch = true
  sprite.hidden = true
  sprite.w = 200
  sprite.x = 10
  sprite.y = 20
  sprite.z = 10
  sprite.zend = true

  sprite.init()

  assert(sprite.cel, 0)
  assert(sprite.flipX, false)
  assert(sprite.flipY, false)
  assert(sprite.h, 0)
  assert(sprite.id, 0)
  assert(sprite.stretch, false)
  assert(sprite.hidden, false)
  assert(sprite.w, 0)
  assert(sprite.x, 0)
  assert(sprite.y, 0)
  assert(sprite.z, Layer.Bottom)
  assert(sprite.zend, false)
})

test('id', () => {
  const pool = TestPool()
  const sprite = TestSprite(pool, 0)

  assert(sprite.id, 0)
  assert(toHex(pool), '00000000000000000000000000000000')

  sprite.id = 1
  assert(sprite.id, 1)
  assert(toHex(pool), '00000000000000000000200000000000')

  sprite.id = 1023
  assert(sprite.id, 1023)
  assert(toHex(pool), '00000000000000000000e07f00000000')

  sprite.id = 1024
  assert(sprite.id, 1024)
  assert(toHex(pool), '00000000000000000000008000000000')

  sprite.id = 2047
  assert(sprite.id, 2047)
  assert(toHex(pool), '00000000000000000000e0ff00000000')

  sprite.id = 2048
  assert(sprite.id, 0)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('stretch', () => {
  const pool = TestPool()
  const sprite = TestSprite(pool, 0)

  assert(sprite.stretch, false)
  assert(toHex(pool), '00000000000000000000000000000000')

  sprite.stretch = true
  assert(sprite.stretch, true)
  assert(toHex(pool), '00000000000080000000000000000000')

  sprite.stretch = false
  assert(sprite.stretch, false)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('hidden', () => {
  const pool = TestPool()
  const sprite = TestSprite(pool, 0)

  assert(sprite.hidden, false)
  assert(toHex(pool), '00000000000000000000000000000000')

  sprite.hidden = true
  assert(sprite.hidden, true)
  assert(toHex(pool), '00000000000000000000000001000000')

  sprite.hidden = false
  assert(sprite.hidden, false)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('width', () => {
  const pool = TestPool()
  const sprite = TestSprite(pool, 0)

  assert(sprite.w, 0)
  assert(toHex(pool), '00000000000000000000000000000000')

  sprite.w = 1
  assert(sprite.w, 1)
  assert(toHex(pool), '00000000000000010000000000000000')

  sprite.w = 4095
  assert(sprite.w, 4095)
  assert(toHex(pool), '00000000000000ff0f00000000000000')

  sprite.w = 4096
  assert(sprite.w, 0)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('x', () => {
  const pool = TestPool()
  const sprite = TestSprite(pool, 0)

  sprite.x = -131073
  assert(sprite.x, 131071)
  assert(toHex(pool), 'c0ff7f00000000000000000000000000')

  sprite.x = -131072.015625
  assert(sprite.x, 131071.984375)
  assert(toHex(pool), 'ffff7f00000000000000000000000000')

  sprite.x = -131072
  assert(sprite.x, -131072)
  assert(toHex(pool), '00008000000000000000000000000000')

  sprite.x = -0.999
  assert(sprite.x, -0.984375)
  assert(toHex(pool), 'c1ffff00000000000000000000000000')

  sprite.x = -0.984375
  assert(sprite.x, -0.984375)
  assert(toHex(pool), 'c1ffff00000000000000000000000000')

  sprite.x = -0.015625
  assert(sprite.x, -0.015625)
  assert(toHex(pool), 'ffffff00000000000000000000000000')

  sprite.x = 0
  assert(sprite.x, 0)
  assert(toHex(pool), '00000000000000000000000000000000')

  sprite.x = 0.015625
  assert(sprite.x, 0.015625)
  assert(toHex(pool), '01000000000000000000000000000000')

  sprite.x = 0.984375
  assert(sprite.x, 0.984375)
  assert(toHex(pool), '3f000000000000000000000000000000')

  sprite.x = 0.999
  assert(sprite.x, 0.984375)
  assert(toHex(pool), '3f000000000000000000000000000000')

  sprite.x = 1
  assert(sprite.x, 1)
  assert(toHex(pool), '40000000000000000000000000000000')

  sprite.x = 131071.984375
  assert(sprite.x, 131071.984375)
  assert(toHex(pool), 'ffff7f00000000000000000000000000')

  sprite.x = 131072
  assert(sprite.x, -131072)
  assert(toHex(pool), '00008000000000000000000000000000')
})

test('y', () => {
  const pool = TestPool()
  const sprite = TestSprite(pool, 0)

  sprite.y = -131073
  assert(sprite.y, 131071)
  assert(toHex(pool), '000000c0ff7f00000000000000000000')

  sprite.y = -131072.015625
  assert(sprite.y, 131071.984375)
  assert(toHex(pool), '000000ffff7f00000000000000000000')

  sprite.y = -131072
  assert(sprite.y, -131072)
  assert(toHex(pool), '00000000008000000000000000000000')

  sprite.y = -0.999
  assert(sprite.y, -0.984375)
  assert(toHex(pool), '000000c1ffff00000000000000000000')

  sprite.y = -0.984375
  assert(sprite.y, -0.984375)
  assert(toHex(pool), '000000c1ffff00000000000000000000')

  sprite.y = -0.015625
  assert(sprite.y, -0.015625)
  assert(toHex(pool), '000000ffffff00000000000000000000')

  sprite.y = 0
  assert(sprite.y, 0)
  assert(toHex(pool), '00000000000000000000000000000000')

  sprite.y = 0.015625
  assert(sprite.y, 0.015625)
  assert(toHex(pool), '00000001000000000000000000000000')

  sprite.y = 0.984375
  assert(sprite.y, 0.984375)
  assert(toHex(pool), '0000003f000000000000000000000000')

  sprite.y = 0.999
  assert(sprite.y, 0.984375)
  assert(toHex(pool), '0000003f000000000000000000000000')

  sprite.y = 1
  assert(sprite.y, 1)
  assert(toHex(pool), '00000040000000000000000000000000')

  sprite.y = 131071.984375
  assert(sprite.y, 131071.984375)
  assert(toHex(pool), '000000ffff7f00000000000000000000')

  sprite.y = 131072
  assert(sprite.y, -131072)
  assert(toHex(pool), '00000000008000000000000000000000')
})

test('z', () => {
  const pool = TestPool()
  const sprite = TestSprite(pool, 0)

  sprite.z = 0
  assert(sprite.z, 0)
  assert(toHex(pool), '00000000000000000000000000000000')

  sprite.z = 1
  assert(sprite.z, 1)
  assert(toHex(pool), '00000000000001000000000000000000')

  sprite.z = Layer.Top
  assert(sprite.z, Layer.Top)
  assert(toHex(pool), '0000000000000f000000000000000000')

  sprite.z = (Layer.Top + 1) as Layer
  assert(sprite.z, 0)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('zend', () => {
  const pool = TestPool()
  const sprite = TestSprite(pool, 0)

  assert(sprite.zend, false)
  assert(toHex(pool), '00000000000000000000000000000000')

  sprite.zend = true
  assert(sprite.zend, true)
  assert(toHex(pool), '00000000000010000000000000000000')

  sprite.zend = false
  assert(sprite.zend, false)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('anim', () => {
  const sprite = TestSprite()
  sprite.tag = 'stem--AnimA'
  assert(sprite.anim, animA)
})

test('hitbox', () => {
  const sprite = TestSprite()
  sprite.tag = 'stem--AnimA'
  assert(sprite.hitbox, {x: 1, y: 2, w: 3, h: 4})
  sprite.flipX = true
  assert(sprite.hitbox, {x: 6, y: 2, w: 3, h: 4})
  sprite.flipY = true
  assert(sprite.hitbox, {x: 6, y: 14, w: 3, h: 4})
  sprite.x = 1
  assert(sprite.hitbox, {x: 7, y: 14, w: 3, h: 4})
  sprite.y = 1
  assert(sprite.hitbox, {x: 7, y: 15, w: 3, h: 4})
})

test('hits', () => {
  const sprite = TestSprite()
  sprite.tag = 'stem--AnimA'
  assert(sprite.hits({x: 1, y: 2}), true)
  assert(sprite.hits({x: 4, y: 6}), false)
})

describe('hitsZ()', () => {
  test('same layer type delegates to hits()', () => {
    const a = TestSprite()
    a.tag = 'stem--AnimA'
    a.z = Layer.A
    const b = TestSprite()
    b.tag = 'stem--AnimA'
    b.z = Layer.B
    const cam = {x: 100, y: 100}

    assert(a.hitsZ(b, cam), true)
    assert(b.hitsZ(a, cam), true)
  })

  test('different layer types adjusts for cam', () => {
    const world = TestSprite()
    world.tag = 'stem--AnimA'
    world.z = Layer.A
    const ui = TestSprite()
    ui.tag = 'stem--AnimA'
    ui.z = Layer.UIA
    const cam = {x: 50, y: 50}

    assert(world.hitsZ(ui, cam), false)
    assert(ui.hitsZ(world, cam), false)

    world.x = 50
    world.y = 50
    assert(ui.hitsZ(world, cam), true)
    assert(world.hitsZ(ui, cam), true)
  })

  test('UI checking world adjusts with negative offset', () => {
    const world = TestSprite()
    world.tag = 'stem--AnimA'
    world.z = Layer.A
    const ui = TestSprite()
    ui.tag = 'stem--AnimA'
    ui.z = Layer.UIA
    const cam = {x: 50, y: 50}

    assert(ui.hitsZ(world, cam), false)
    assert(world.hitsZ(ui, cam), false)

    ui.x = -50
    ui.y = -50
    assert(ui.hitsZ(world, cam), true)
    assert(world.hitsZ(ui, cam), true)
  })
})

test('hurtbox', () => {
  const sprite = TestSprite()
  sprite.tag = 'stem--AnimA'
  assert(sprite.hurtbox, {x: 1, y: 2, w: 3, h: 4})
  sprite.flipX = true
  assert(sprite.hurtbox, {x: 6, y: 2, w: 3, h: 4})
  sprite.flipY = true
  assert(sprite.hurtbox, {x: 6, y: 14, w: 3, h: 4})
})

test('looped', () => {
  const looper = {age: 0 as Millis}
  const sprite = new Sprite(TestPool(), 0, atlas, looper)

  sprite.tag = 'stem--AnimA'
  for (let i = 0; i < animCels * 5; i++) {
    looper.age = (celMillis * i) as Millis
    assert(sprite.looped, i % (animA.cels * 2) >= animA.cels, `${i}`)
  }

  looper.age = 0
  sprite.tag = 'stem--AnimB'
  for (let i = 0; i < animCels * 5; i++) {
    looper.age = (celMillis * i) as Millis
    assert(sprite.looped, i % (animB.cels * 2) >= animB.cels, `${i}`)
  }

  looper.age = (celMillis * (animCels + 0)) as Millis
  sprite.tag = 'stem--AnimB'
  assert(sprite.cel, animCels)
  assert(sprite.looped, false)

  for (let i = 0; i < animCels - 1; i++) {
    looper.age = (celMillis * (animCels + i)) as Millis
    assert(sprite.looped, false, `${i}`)
  }

  looper.age = (celMillis * (animCels + animCels)) as Millis
  assert(sprite.looped, true)

  looper.age = (celMillis * (animCels + animCels + 1)) as Millis
  assert(sprite.looped, true)
})

test('midHit', () => {
  const sprite = TestSprite()
  sprite.tag = 'stem--AnimA'
  // hitbox is {x: 1, y: 2, w: 3, h: 4}.
  assert(sprite.midHit, {x: 2.5, y: 4})

  sprite.x = 10
  sprite.y = 20
  // hitbox is {x: 11, y: 22, w: 3, h: 4}.
  assert(sprite.midHit, {x: 12.5, y: 24})

  sprite.flipX = true
  // hitbox is {x: 16, y: 22, w: 3, h: 4}.
  assert(sprite.midHit, {x: 17.5, y: 24})
})

test('midHurt', () => {
  const sprite = TestSprite()
  sprite.tag = 'stem--AnimA'
  // hurtbox is {x: 1, y: 2, w: 3, h: 4}.
  assert(sprite.midHurt, {x: 2.5, y: 4})

  sprite.x = 10
  sprite.y = 20
  // hurtbox is {x: 11, y: 22, w: 3, h: 4}.
  assert(sprite.midHurt, {x: 12.5, y: 24})

  sprite.flipY = true
  // hurtbox is {x: 11, y: 34, w: 3, h: 4}.
  assert(sprite.midHurt, {x: 12.5, y: 36})
})

test('reset()', () => {
  const looper = {age: 0 as Millis}
  const sprite = new Sprite(TestPool(), 0, atlas, looper)
  sprite.tag = 'stem--AnimA'

  for (let i = 0; i < animCels * 5; i++) {
    looper.age = (celMillis * i) as Millis
    sprite.reset()
    assert(sprite.cel, i % (2 * sprite.anim.cels), `${i}`)
  }
})

test('tag', () => {
  const looper = {age: 0 as Millis}
  const sprite = new Sprite(TestPool(), 0, atlas, looper)

  sprite.tag = 'stem--AnimA'
  assert(sprite.tag, 'stem--AnimA')
  assert(sprite.w, 10)
  assert(sprite.h, 20)
  assert(sprite.id, 0)
  assert(sprite.cel, 0)

  looper.age = (celMillis * 1) as Millis
  sprite.tag = 'stem--AnimB'
  assert(sprite.tag, 'stem--AnimB')
  assert(sprite.w, 30)
  assert(sprite.h, 40)
  assert(sprite.id, 1)
  assert(sprite.cel, 1)
})

test('diagonalize()', () => {
  const cases: [XY, number, XY][] = [
    [{x: -5, y: -5}, 0, {x: -5, y: -5}],

    [{x: -5, y: -5}, 1, {x: -4.5, y: -4.5}],
    [{x: -4.5, y: -4.5}, 1, {x: -4.5, y: -4.5}],

    [{x: -4.5, y: -4}, 1, {x: -4.5, y: -3.5}],

    [{x: -1, y: -1}, 1, {x: -0.5, y: -0.5}],
    [{x: -0.5, y: -0.5}, 1, {x: -0.5, y: -0.5}],
    [{x: 0, y: 0}, 1, {x: 0.5, y: 0.5}],
    [{x: 0.5, y: 0.5}, 1, {x: 0.5, y: 0.5}],
    [{x: 1, y: 1}, 1, {x: 1.5, y: 1.5}],

    [{x: -5, y: -5}, -1, {x: -4.5, y: -4.515625}],
    [{x: -4.5, y: -4.515625}, -1, {x: -4.5, y: -4.515625}],

    [{x: -4.5, y: -4}, -1, {x: -4.5, y: -3.515625}],

    [{x: -1, y: -1}, -1, {x: -0.5, y: -0.515625}],
    [{x: -0.5, y: -0.515625}, -1, {x: -0.5, y: -0.515625}],
    [{x: 0, y: 0}, -1, {x: 0.5, y: 0.484375}],
    [{x: 0.5, y: 0.515625}, -1, {x: 0.5, y: 0.484375}],
    [{x: 1, y: 1}, -1, {x: 1.5, y: 1.484375}]
  ]
  for (const [xy, dir, out] of cases) {
    const cp = {...xy}
    diagonalize(xy, dir)
    assert(xy, out, `(${cp.x}, ${cp.y}) dir=${dir}`)
  }
})

test('toString()', () => {
  const sprite = TestSprite()
  sprite.tag = 'stem--AnimA'
  assert(sprite.toString(), 'Sprite{stem--AnimA (0 0 0) 10×20}')
  sprite.tag = 'stem--AnimB'
  sprite.x = 1
  sprite.y = 2
  sprite.z = 3
  sprite.w = 4
  sprite.h = 5
  assert(sprite.toString(), 'Sprite{stem--AnimB (1 2 3) 4×5}')
})

test('floorSpriteEpsilon()', () => {
  for (const [x, out] of [
    [-10.125, -10.125],
    [-10.1, -10.109375],
    [-10, -10],
    [-1.125, -1.125],
    [-1.1, -1.109375],
    [-1, -1],
    [0, 0],
    [0.125, 0.125],
    [0.1, 0.09375],
    [1, 1],
    [1.1, 1.09375],
    [1.125, 1.125],
    [10, 10],
    [10.1, 10.09375],
    [10.125, 10.125]
  ] as const)
    assert(floorSpriteEpsilon(x), out, `${x}`)
})

function TestSprite(
  pool: Readonly<SpritePool> = TestPool(),
  i: number = 0
): Sprite {
  return new Sprite(pool, i, atlas, {age: 0})
}

function TestPool(): SpritePool {
  return SpritePool({atlas, looper: {age: 0}, pageBlocks: 1})
}

function toHex(pool: {readonly view: DataView<ArrayBuffer>}): string {
  return [...new Uint8Array(pool.view.buffer)]
    .map(v => v.toString(16).padStart(2, '0'))
    .join('')
}
