import assert from 'node:assert/strict'
import {test} from 'node:test'
import type {Millis} from '../types/time.ts'
import {type Anim, type Atlas, animCels, celMillis} from './atlas.ts'
import {Layer} from './layer.ts'
import {
  Drawable,
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

const atlas: Readonly<Atlas<'stem--AnimA' | 'stem--AnimB'>> = {
  anim: {'stem--AnimA': animA, 'stem--AnimB': animB},
  celXYWH: [],
  tags: ['stem--AnimA', 'stem--AnimB']
}

class TestDrawable extends Drawable {}

test('above() layer', () => {
  const l = new TestDrawable(TestPool(), 0)
  const r = new TestDrawable(TestPool(), 0)

  l.z = 1
  r.z = 2
  assert.equal(l.above(r), true)
  assert.equal(r.above(l), false)

  l.z = 2
  r.z = 2
  assert.equal(l.above(r), false)
  assert.equal(r.above(l), false)

  l.z = 3
  r.z = 2
  assert.equal(l.above(r), false)
  assert.equal(r.above(l), true)
})

test('above() zend', () => {
  const l = new TestDrawable(TestPool(), 0)
  const r = new TestDrawable(TestPool(), 0)

  l.h = 10
  r.h = 100
  assert.equal(l.above(r), false)
  assert.equal(r.above(l), false)

  l.zend = true
  assert.equal(l.above(r), true)
  assert.equal(r.above(l), false)

  r.zend = true
  assert.equal(l.above(r), false)
  assert.equal(r.above(l), true)
})

test('cel', () => {
  const view = TestPool()
  const draw = new TestDrawable(view, 0)

  assert.equal(draw.cel, 0)
  assert.equal(toHex(view), '000000000000000000000000')

  draw.cel = 1
  assert.equal(draw.cel, 1)
  assert.equal(toHex(view), '000000000000000000000100')

  draw.cel = animCels
  assert.equal(draw.cel, animCels)
  assert.equal(toHex(view), '000000000000000000001000')

  draw.cel = animCels * 2 - 1
  assert.equal(draw.cel, animCels * 2 - 1)
  assert.equal(toHex(view), '000000000000000000001f00')

  draw.cel = animCels * 2
  assert.equal(draw.cel, 0)
  assert.equal(toHex(view), '000000000000000000000000')
})

test('clips()', () => {
  const draw = new TestDrawable(TestPool(), 0)
  assert.equal(draw.clips({x: 1, y: 1}), false)

  draw.w = draw.h = 10
  assert.equal(draw.clips({x: 1, y: 1}), true)

  assert.equal(draw.clips({x: 11, y: 11}), false)
})

test('flipX', () => {
  const view = TestPool()
  const draw = new TestDrawable(view, 0)

  assert.equal(draw.flipX, false)
  assert.equal(toHex(view), '000000000000000000000000')

  draw.flipX = true
  assert.equal(draw.flipX, true)
  assert.equal(toHex(view), '000000000000400000000000')

  draw.flipX = false
  assert.equal(draw.flipX, false)
  assert.equal(toHex(view), '000000000000000000000000')
})

test('flipY', () => {
  const view = TestPool()
  const draw = new TestDrawable(view, 0)

  assert.equal(draw.flipY, false)
  assert.equal(toHex(view), '000000000000000000000000')

  draw.flipY = true
  assert.equal(draw.flipY, true)
  assert.equal(toHex(view), '000000000000200000000000')

  draw.flipY = false
  assert.equal(draw.flipY, false)
  assert.equal(toHex(view), '000000000000000000000000')
})

test('height', () => {
  const view = TestPool()
  const draw = new TestDrawable(view, 0)

  assert.equal(draw.h, 0)
  assert.equal(toHex(view), '000000000000000000000000')

  draw.h = 1
  assert.equal(draw.h, 1)
  assert.equal(toHex(view), '000000000000000010000000')

  draw.h = 1024
  assert.equal(draw.h, 1024)
  assert.equal(toHex(view), '000000000000000000400000')

  draw.h = 4095
  assert.equal(draw.h, 4095)
  assert.equal(toHex(view), '0000000000000000f0ff0000')

  draw.h = 4096
  assert.equal(draw.h, 0)
  assert.equal(toHex(view), '000000000000000000000000')
})

test('index', () => {
  const draw = new TestDrawable(TestPool(), 0)

  assert.equal(draw.i, 0)

  draw.i = 1
  assert.equal(draw.i, 1)
})

test('id', () => {
  const view = TestPool()
  const draw = new TestDrawable(view, 0)

  assert.equal(draw.id, 0)
  assert.equal(toHex(view), '000000000000000000000000')

  draw.id = 1
  assert.equal(draw.id, 1)
  assert.equal(toHex(view), '000000000000000000002000')

  draw.id = 1023
  assert.equal(draw.id, 1023)
  assert.equal(toHex(view), '00000000000000000000e07f')

  draw.id = 1024
  assert.equal(draw.id, 1024)
  assert.equal(toHex(view), '000000000000000000000080')

  draw.id = 2047
  assert.equal(draw.id, 2047)
  assert.equal(toHex(view), '00000000000000000000e0ff')

  draw.id = 2048
  assert.equal(draw.id, 0)
  assert.equal(toHex(view), '000000000000000000000000')
})

test('stretch', () => {
  const view = TestPool()
  const draw = new TestDrawable(view, 0)

  assert.equal(draw.stretch, false)
  assert.equal(toHex(view), '000000000000000000000000')

  draw.stretch = true
  assert.equal(draw.stretch, true)
  assert.equal(toHex(view), '000000000000800000000000')

  draw.stretch = false
  assert.equal(draw.stretch, false)
  assert.equal(toHex(view), '000000000000000000000000')
})

test('width', () => {
  const view = TestPool()
  const draw = new TestDrawable(view, 0)

  assert.equal(draw.w, 0)
  assert.equal(toHex(view), '000000000000000000000000')

  draw.w = 1
  assert.equal(draw.w, 1)
  assert.equal(toHex(view), '000000000000000100000000')

  draw.w = 4095
  assert.equal(draw.w, 4095)
  assert.equal(toHex(view), '00000000000000ff0f000000')

  draw.w = 4096
  assert.equal(draw.w, 0)
  assert.equal(toHex(view), '000000000000000000000000')
})

test('x', () => {
  const view = TestPool()
  const draw = new TestDrawable(view, 0)

  draw.x = -131073
  assert.equal(draw.x, 131071)
  assert.equal(toHex(view), 'c0ff7f000000000000000000')

  draw.x = -131072.015625
  assert.equal(draw.x, 131071.984375)
  assert.equal(toHex(view), 'ffff7f000000000000000000')

  draw.x = -131072
  assert.equal(draw.x, -131072)
  assert.equal(toHex(view), '000080000000000000000000')

  draw.x = -0.999
  assert.equal(draw.x, -0.984375)
  assert.equal(toHex(view), 'c1ffff000000000000000000')

  draw.x = -0.984375
  assert.equal(draw.x, -0.984375)
  assert.equal(toHex(view), 'c1ffff000000000000000000')

  draw.x = -0.015625
  assert.equal(draw.x, -0.015625)
  assert.equal(toHex(view), 'ffffff000000000000000000')

  draw.x = 0
  assert.equal(draw.x, 0)
  assert.equal(toHex(view), '000000000000000000000000')

  draw.x = 0.015625
  assert.equal(draw.x, 0.015625)
  assert.equal(toHex(view), '010000000000000000000000')

  draw.x = 0.984375
  assert.equal(draw.x, 0.984375)
  assert.equal(toHex(view), '3f0000000000000000000000')

  draw.x = 0.999
  assert.equal(draw.x, 0.984375)
  assert.equal(toHex(view), '3f0000000000000000000000')

  draw.x = 1
  assert.equal(draw.x, 1)
  assert.equal(toHex(view), '400000000000000000000000')

  draw.x = 131071.984375
  assert.equal(draw.x, 131071.984375)
  assert.equal(toHex(view), 'ffff7f000000000000000000')

  draw.x = 131072
  assert.equal(draw.x, -131072)
  assert.equal(toHex(view), '000080000000000000000000')
})

test('xy', () => {
  const view = TestPool()
  const draw = new TestDrawable(view, 0)

  draw.xy = {x: 1, y: 2}
  assert.deepEqual(draw.xy, {x: 1, y: 2})

  draw.xy = {x: 3, y: 4}
  assert.deepEqual(draw.xy, {x: 3, y: 4})
})

test('y', () => {
  const view = TestPool()
  const draw = new TestDrawable(view, 0)

  draw.y = -131073
  assert.equal(draw.y, 131071)
  assert.equal(toHex(view), '000000c0ff7f000000000000')

  draw.y = -131072.015625
  assert.equal(draw.y, 131071.984375)
  assert.equal(toHex(view), '000000ffff7f000000000000')

  draw.y = -131072
  assert.equal(draw.y, -131072)
  assert.equal(toHex(view), '000000000080000000000000')

  draw.y = -0.999
  assert.equal(draw.y, -0.984375)
  assert.equal(toHex(view), '000000c1ffff000000000000')

  draw.y = -0.984375
  assert.equal(draw.y, -0.984375)
  assert.equal(toHex(view), '000000c1ffff000000000000')

  draw.y = -0.015625
  assert.equal(draw.y, -0.015625)
  assert.equal(toHex(view), '000000ffffff000000000000')

  draw.y = 0
  assert.equal(draw.y, 0)
  assert.equal(toHex(view), '000000000000000000000000')

  draw.y = 0.015625
  assert.equal(draw.y, 0.015625)
  assert.equal(toHex(view), '000000010000000000000000')

  draw.y = 0.984375
  assert.equal(draw.y, 0.984375)
  assert.equal(toHex(view), '0000003f0000000000000000')

  draw.y = 0.999
  assert.equal(draw.y, 0.984375)
  assert.equal(toHex(view), '0000003f0000000000000000')

  draw.y = 1
  assert.equal(draw.y, 1)
  assert.equal(toHex(view), '000000400000000000000000')

  draw.y = 131071.984375
  assert.equal(draw.y, 131071.984375)
  assert.equal(toHex(view), '000000ffff7f000000000000')

  draw.y = 131072
  assert.equal(draw.y, -131072)
  assert.equal(toHex(view), '000000000080000000000000')
})

test('z', () => {
  const view = TestPool()
  const draw = new TestDrawable(view, 0)

  draw.z = 0
  assert.equal(draw.z, 0)
  assert.equal(toHex(view), '000000000000000000000000')

  draw.z = 1
  assert.equal(draw.z, 1)
  assert.equal(toHex(view), '000000000000010000000000')

  draw.z = Layer.Top
  assert.equal(draw.z, Layer.Top)
  assert.equal(toHex(view), '0000000000000f0000000000')

  draw.z = (Layer.Top + 1) as Layer
  assert.equal(draw.z, 0)
  assert.equal(toHex(view), '000000000000000000000000')
})

test('zend', () => {
  const view = TestPool()
  const draw = new TestDrawable(view, 0)

  assert.equal(draw.zend, false)
  assert.equal(toHex(view), '000000000000000000000000')

  draw.zend = true
  assert.equal(draw.zend, true)
  assert.equal(toHex(view), '000000000000100000000000')

  draw.zend = false
  assert.equal(draw.zend, false)
  assert.equal(toHex(view), '000000000000000000000000')
})

test('anim', () => {
  const sprite = new Sprite(TestPool(), 0, atlas, {age: 0})
  sprite.tag = 'stem--AnimA'
  assert.equal(sprite.anim, animA)
})

test('hitbox', () => {
  const sprite = new Sprite(TestPool(), 0, atlas, {age: 0})
  sprite.tag = 'stem--AnimA'
  assert.deepEqual(sprite.hitbox, {x: 1, y: 2, w: 3, h: 4})
  sprite.flipX = true
  assert.deepEqual(sprite.hitbox, {x: 6, y: 2, w: 3, h: 4})
  sprite.flipY = true
  assert.deepEqual(sprite.hitbox, {x: 6, y: 14, w: 3, h: 4})
  sprite.x = 1
  assert.deepEqual(sprite.hitbox, {x: 7, y: 14, w: 3, h: 4})
  sprite.y = 1
  assert.deepEqual(sprite.hitbox, {x: 7, y: 15, w: 3, h: 4})
})

test('hits', () => {
  const sprite = new Sprite(TestPool(), 0, atlas, {age: 0})
  sprite.tag = 'stem--AnimA'
  assert.equal(sprite.hits({x: 1, y: 2}), true)
  assert.equal(sprite.hits({x: 4, y: 6}), false)
})

test('hurtbox', () => {
  const sprite = new Sprite(TestPool(), 0, atlas, {age: 0})
  sprite.tag = 'stem--AnimA'
  assert.deepEqual(sprite.hurtbox, {x: 1, y: 2, w: 3, h: 4})
  sprite.flipX = true
  assert.deepEqual(sprite.hurtbox, {x: 6, y: 2, w: 3, h: 4})
  sprite.flipY = true
  assert.deepEqual(sprite.hurtbox, {x: 6, y: 14, w: 3, h: 4})
})

test('looped', () => {
  const looper = {age: 0 as Millis}
  const sprite = new Sprite(TestPool(), 0, atlas, looper)

  sprite.tag = 'stem--AnimA'
  for (let i = 0; i < animCels * 5; i++) {
    looper.age = (celMillis * i) as Millis
    assert.equal(sprite.looped, i % (animA.cels * 2) >= animA.cels, `${i}`)
  }

  looper.age = 0
  sprite.tag = 'stem--AnimB'
  for (let i = 0; i < animCels * 5; i++) {
    looper.age = (celMillis * i) as Millis
    assert.equal(sprite.looped, i % (animB.cels * 2) >= animB.cels, `${i}`)
  }

  looper.age = (celMillis * (animCels + 0)) as Millis
  sprite.tag = 'stem--AnimB'
  assert.equal(sprite.cel, animCels)
  assert.equal(sprite.looped, false)

  for (let i = 0; i < animCels - 1; i++) {
    looper.age = (celMillis * (animCels + i)) as Millis
    assert.equal(sprite.looped, false, `${i}`)
  }

  looper.age = (celMillis * (animCels + animCels)) as Millis
  assert.equal(sprite.looped, true)

  looper.age = (celMillis * (animCels + animCels + 1)) as Millis
  assert.equal(sprite.looped, true)
})

test('reset()', () => {
  const looper = {age: 0 as Millis}
  const sprite = new Sprite(TestPool(), 0, atlas, looper)
  sprite.tag = 'stem--AnimA'

  for (let i = 0; i < animCels * 5; i++) {
    looper.age = (celMillis * i) as Millis
    sprite.reset()
    assert.equal(sprite.cel, i % (2 * sprite.anim.cels), `${i}`)
  }
})

test('tag', () => {
  const looper = {age: 0 as Millis}
  const sprite = new Sprite(TestPool(), 0, atlas, looper)

  sprite.tag = 'stem--AnimA'
  assert.equal(sprite.tag, 'stem--AnimA')
  assert.equal(sprite.w, 10)
  assert.equal(sprite.h, 20)
  assert.equal(sprite.id, 0)
  assert.equal(sprite.cel, 0)

  looper.age = (celMillis * 1) as Millis
  sprite.tag = 'stem--AnimB'
  assert.equal(sprite.tag, 'stem--AnimB')
  assert.equal(sprite.w, 30)
  assert.equal(sprite.h, 40)
  assert.equal(sprite.id, 1)
  assert.equal(sprite.cel, 1)
})

test('diagonalize()', () => {
  for (const [xy, dir, out] of [
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
  ] as const) {
    const cp = {...xy}
    diagonalize(xy, dir)
    assert.deepEqual(xy, out, `(${cp.x}, ${cp.y}) dir=${dir}`)
  }
})

test('toString()', () => {
  const sprite = new Sprite(TestPool(), 0, atlas, {age: 0})
  sprite.tag = 'stem--AnimA'
  assert.equal(sprite.toString(), 'Sprite{stem--AnimA (0 0 0) 10×20}')
  sprite.tag = 'stem--AnimB'
  sprite.x = 1
  sprite.y = 2
  sprite.z = 3
  sprite.w = 4
  sprite.h = 5
  assert.equal(sprite.toString(), 'Sprite{stem--AnimB (1 2 3) 4×5}')
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
    assert.equal(truncDrawableEpsilon(x), out, `${x}`)
})

function TestPool(): {free(): void; view: DataView<ArrayBuffer>} {
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
