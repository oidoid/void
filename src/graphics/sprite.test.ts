import {describe, test} from 'node:test'
import {assert} from '../test/assert.ts'
import type {XY} from '../types/geo.ts'
import type {Millis} from '../types/time.ts'
import {type Anim, type Atlas, animCels, celMillis} from './atlas.ts'
import {Layer} from './layer.ts'
import {
  Drawable,
  type DrawablePool,
  diagonalize,
  drawableBytes,
  Sprite,
  truncDrawableEpsilon
} from './sprite.ts'

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
  const l = TestDrawable()
  const r = TestDrawable()

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
  const l = TestDrawable()
  const r = TestDrawable()

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

test('cel', () => {
  const pool = TestPool()
  const draw = TestDrawable(pool, 0)

  assert(draw.cel, 0)
  assert(toHex(pool), '00000000000000000000000000000000')

  draw.cel = 1
  assert(draw.cel, 1)
  assert(toHex(pool), '00000000000000000000010000000000')

  draw.cel = animCels
  assert(draw.cel, animCels)
  assert(toHex(pool), '00000000000000000000100000000000')

  draw.cel = animCels * 2 - 1
  assert(draw.cel, animCels * 2 - 1)
  assert(toHex(pool), '000000000000000000001f0000000000')

  draw.cel = animCels * 2
  assert(draw.cel, 0)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('clips()', () => {
  const draw = TestDrawable()
  assert(draw.clips({x: 1, y: 1}), false)

  draw.w = draw.h = 10
  assert(draw.clips({x: 1, y: 1}), true)

  assert(draw.clips({x: 11, y: 11}), false)
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
  const draw = TestDrawable(pool, 0)

  assert(draw.flipX, false)
  assert(toHex(pool), '00000000000000000000000000000000')

  draw.flipX = true
  assert(draw.flipX, true)
  assert(toHex(pool), '00000000000040000000000000000000')

  draw.flipX = false
  assert(draw.flipX, false)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('flipY', () => {
  const pool = TestPool()
  const draw = TestDrawable(pool, 0)

  assert(draw.flipY, false)
  assert(toHex(pool), '00000000000000000000000000000000')

  draw.flipY = true
  assert(draw.flipY, true)
  assert(toHex(pool), '00000000000020000000000000000000')

  draw.flipY = false
  assert(draw.flipY, false)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('height', () => {
  const pool = TestPool()
  const draw = TestDrawable(pool, 0)

  assert(draw.h, 0)
  assert(toHex(pool), '00000000000000000000000000000000')

  draw.h = 1
  assert(draw.h, 1)
  assert(toHex(pool), '00000000000000001000000000000000')

  draw.h = 1024
  assert(draw.h, 1024)
  assert(toHex(pool), '00000000000000000040000000000000')

  draw.h = 4095
  assert(draw.h, 4095)
  assert(toHex(pool), '0000000000000000f0ff000000000000')

  draw.h = 4096
  assert(draw.h, 0)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('index', () => {
  const draw = TestDrawable()

  assert(draw.i, 0)

  draw.i = 1
  assert(draw.i, 1)
})

test('init()', () => {
  const pool = TestPool()
  const draw = TestDrawable(pool, 0)

  draw.cel = 5
  draw.flipX = true
  draw.flipY = true
  draw.h = 100
  draw.id = 42
  draw.stretch = true
  draw.visible = true
  draw.w = 200
  draw.x = 10
  draw.y = 20
  draw.z = 10
  draw.zend = true

  draw.init()

  assert(draw.cel, 0)
  assert(draw.flipX, false)
  assert(draw.flipY, false)
  assert(draw.h, 0)
  assert(draw.id, 0)
  assert(draw.stretch, false)
  assert(draw.visible, true)
  assert(draw.w, 0)
  assert(draw.x, 0)
  assert(draw.y, 0)
  assert(draw.z, Layer.Bottom)
  assert(draw.zend, false)
})

test('id', () => {
  const pool = TestPool()
  const draw = TestDrawable(pool, 0)

  assert(draw.id, 0)
  assert(toHex(pool), '00000000000000000000000000000000')

  draw.id = 1
  assert(draw.id, 1)
  assert(toHex(pool), '00000000000000000000200000000000')

  draw.id = 1023
  assert(draw.id, 1023)
  assert(toHex(pool), '00000000000000000000e07f00000000')

  draw.id = 1024
  assert(draw.id, 1024)
  assert(toHex(pool), '00000000000000000000008000000000')

  draw.id = 2047
  assert(draw.id, 2047)
  assert(toHex(pool), '00000000000000000000e0ff00000000')

  draw.id = 2048
  assert(draw.id, 0)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('stretch', () => {
  const pool = TestPool()
  const draw = TestDrawable(pool, 0)

  assert(draw.stretch, false)
  assert(toHex(pool), '00000000000000000000000000000000')

  draw.stretch = true
  assert(draw.stretch, true)
  assert(toHex(pool), '00000000000080000000000000000000')

  draw.stretch = false
  assert(draw.stretch, false)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('visible', () => {
  const pool = TestPool()
  const draw = TestDrawable(pool, 0)

  assert(draw.visible, false)
  assert(toHex(pool), '00000000000000000000000000000000')

  draw.visible = true
  assert(draw.visible, true)
  assert(toHex(pool), '00000000000000000000000001000000')

  draw.visible = false
  assert(draw.visible, false)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('width', () => {
  const pool = TestPool()
  const draw = TestDrawable(pool, 0)

  assert(draw.w, 0)
  assert(toHex(pool), '00000000000000000000000000000000')

  draw.w = 1
  assert(draw.w, 1)
  assert(toHex(pool), '00000000000000010000000000000000')

  draw.w = 4095
  assert(draw.w, 4095)
  assert(toHex(pool), '00000000000000ff0f00000000000000')

  draw.w = 4096
  assert(draw.w, 0)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('x', () => {
  const pool = TestPool()
  const draw = TestDrawable(pool, 0)

  draw.x = -131073
  assert(draw.x, 131071)
  assert(toHex(pool), 'c0ff7f00000000000000000000000000')

  draw.x = -131072.015625
  assert(draw.x, 131071.984375)
  assert(toHex(pool), 'ffff7f00000000000000000000000000')

  draw.x = -131072
  assert(draw.x, -131072)
  assert(toHex(pool), '00008000000000000000000000000000')

  draw.x = -0.999
  assert(draw.x, -0.984375)
  assert(toHex(pool), 'c1ffff00000000000000000000000000')

  draw.x = -0.984375
  assert(draw.x, -0.984375)
  assert(toHex(pool), 'c1ffff00000000000000000000000000')

  draw.x = -0.015625
  assert(draw.x, -0.015625)
  assert(toHex(pool), 'ffffff00000000000000000000000000')

  draw.x = 0
  assert(draw.x, 0)
  assert(toHex(pool), '00000000000000000000000000000000')

  draw.x = 0.015625
  assert(draw.x, 0.015625)
  assert(toHex(pool), '01000000000000000000000000000000')

  draw.x = 0.984375
  assert(draw.x, 0.984375)
  assert(toHex(pool), '3f000000000000000000000000000000')

  draw.x = 0.999
  assert(draw.x, 0.984375)
  assert(toHex(pool), '3f000000000000000000000000000000')

  draw.x = 1
  assert(draw.x, 1)
  assert(toHex(pool), '40000000000000000000000000000000')

  draw.x = 131071.984375
  assert(draw.x, 131071.984375)
  assert(toHex(pool), 'ffff7f00000000000000000000000000')

  draw.x = 131072
  assert(draw.x, -131072)
  assert(toHex(pool), '00008000000000000000000000000000')
})

test('y', () => {
  const pool = TestPool()
  const draw = TestDrawable(pool, 0)

  draw.y = -131073
  assert(draw.y, 131071)
  assert(toHex(pool), '000000c0ff7f00000000000000000000')

  draw.y = -131072.015625
  assert(draw.y, 131071.984375)
  assert(toHex(pool), '000000ffff7f00000000000000000000')

  draw.y = -131072
  assert(draw.y, -131072)
  assert(toHex(pool), '00000000008000000000000000000000')

  draw.y = -0.999
  assert(draw.y, -0.984375)
  assert(toHex(pool), '000000c1ffff00000000000000000000')

  draw.y = -0.984375
  assert(draw.y, -0.984375)
  assert(toHex(pool), '000000c1ffff00000000000000000000')

  draw.y = -0.015625
  assert(draw.y, -0.015625)
  assert(toHex(pool), '000000ffffff00000000000000000000')

  draw.y = 0
  assert(draw.y, 0)
  assert(toHex(pool), '00000000000000000000000000000000')

  draw.y = 0.015625
  assert(draw.y, 0.015625)
  assert(toHex(pool), '00000001000000000000000000000000')

  draw.y = 0.984375
  assert(draw.y, 0.984375)
  assert(toHex(pool), '0000003f000000000000000000000000')

  draw.y = 0.999
  assert(draw.y, 0.984375)
  assert(toHex(pool), '0000003f000000000000000000000000')

  draw.y = 1
  assert(draw.y, 1)
  assert(toHex(pool), '00000040000000000000000000000000')

  draw.y = 131071.984375
  assert(draw.y, 131071.984375)
  assert(toHex(pool), '000000ffff7f00000000000000000000')

  draw.y = 131072
  assert(draw.y, -131072)
  assert(toHex(pool), '00000000008000000000000000000000')
})

test('z', () => {
  const pool = TestPool()
  const draw = TestDrawable(pool, 0)

  draw.z = 0
  assert(draw.z, 0)
  assert(toHex(pool), '00000000000000000000000000000000')

  draw.z = 1
  assert(draw.z, 1)
  assert(toHex(pool), '00000000000001000000000000000000')

  draw.z = Layer.Top
  assert(draw.z, Layer.Top)
  assert(toHex(pool), '0000000000000f000000000000000000')

  draw.z = (Layer.Top + 1) as Layer
  assert(draw.z, 0)
  assert(toHex(pool), '00000000000000000000000000000000')
})

test('zend', () => {
  const pool = TestPool()
  const draw = TestDrawable(pool, 0)

  assert(draw.zend, false)
  assert(toHex(pool), '00000000000000000000000000000000')

  draw.zend = true
  assert(draw.zend, true)
  assert(toHex(pool), '00000000000010000000000000000000')

  draw.zend = false
  assert(draw.zend, false)
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

test('truncDrawableEpsilon()', () => {
  for (const [x, out] of [
    [-10.125, -10.125],
    [-10.1, -10.09375],
    [-10, -10],
    [-1.125, -1.125],
    [-1.1, -1.09375],
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
    assert(truncDrawableEpsilon(x), out, `${x}`)
})

function TestSprite(): Sprite {
  return new Sprite(TestPool(), 0, atlas, {age: 0})
}

function TestDrawable(
  pool: Readonly<DrawablePool> = TestPool(),
  i: number = 0
): Drawable {
  return new (class extends Drawable {})(pool, i)
}

function TestPool(): DrawablePool {
  return {
    free() {},
    view: new DataView(new ArrayBuffer(drawableBytes), 0, drawableBytes)
  }
}

function toHex(pool: {readonly view: DataView<ArrayBuffer>}): string {
  return [...new Uint8Array(pool.view.buffer)]
    .map(v => v.toString(16).padStart(2, '0'))
    .join('')
}
