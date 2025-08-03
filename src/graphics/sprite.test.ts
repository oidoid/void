import assert from 'node:assert/strict'
import {test} from 'node:test'
import type {OriginMillis} from '../types/time.ts'
import {type Anim, type Atlas, celMillis, maxAnimCels} from './atlas.ts'
import {maxLayer} from './layer.ts'
import {Drawable, drawableBytes, Sprite} from './sprite.ts'

const animA: Anim<'stem--AnimA'> = {
  cels: 10,
  id: 0,
  tag: 'stem--AnimA',
  x: 5,
  y: 10,
  w: 10,
  h: 20,
  hitbox: {x: 1, y: 2, w: 3, h: 4},
  hurtbox: {x: 1, y: 2, w: 3, h: 4}
}
const animB: Anim<'stem--AnimB'> = {
  cels: maxAnimCels,
  id: 1,
  tag: 'stem--AnimB',
  x: 10,
  y: 20,
  w: 30,
  h: 40,
  hitbox: {x: 1, y: 2, w: 3, h: 4},
  hurtbox: {x: 1, y: 2, w: 3, h: 4}
}

const atlas: Readonly<Atlas<`stem--Anim${'A' | 'B'}`>> = {
  tag: [animA.tag, animB.tag],
  anim: {'stem--AnimA': animA, 'stem--AnimB': animB}
}

class TestDrawable extends Drawable {}

test('above() layer', () => {
  const l = new TestDrawable(TestView(), 0)
  const r = new TestDrawable(TestView(), 0)

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
  const l = new TestDrawable(TestView(), 0)
  const r = new TestDrawable(TestView(), 0)

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
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  assert.equal(draw.cel, 0)
  assert.equal(toHex(view), '0000000000000000000000')

  draw.cel = 1
  assert.equal(draw.cel, 1)
  assert.equal(toHex(view), '0000000000000000000100')

  draw.cel = maxAnimCels
  assert.equal(draw.cel, maxAnimCels)
  assert.equal(toHex(view), '0000000000000000001000')

  draw.cel = maxAnimCels * 2 - 1
  assert.equal(draw.cel, maxAnimCels * 2 - 1)
  assert.equal(toHex(view), '0000000000000000001f00')

  draw.cel = maxAnimCels * 2
  assert.equal(draw.cel, 0)
  assert.equal(toHex(view), '0000000000000000000000')
})

test('clips()', () => {
  const draw = new TestDrawable(TestView(), 0)
  assert.equal(draw.clips({x: 1, y: 1}), false)

  draw.w = draw.h = 10
  assert.equal(draw.clips({x: 1, y: 1}), true)

  assert.equal(draw.clips({x: 11, y: 11}), false)
})

test('flipX', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  assert.equal(draw.flipX, false)
  assert.equal(toHex(view), '0000000000000000000000')

  draw.flipX = true
  assert.equal(draw.flipX, true)
  assert.equal(toHex(view), '0000000000400000000000')

  draw.flipX = false
  assert.equal(draw.flipX, false)
  assert.equal(toHex(view), '0000000000000000000000')
})

test('flipY', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  assert.equal(draw.flipY, false)
  assert.equal(toHex(view), '0000000000000000000000')

  draw.flipY = true
  assert.equal(draw.flipY, true)
  assert.equal(toHex(view), '0000000000200000000000')

  draw.flipY = false
  assert.equal(draw.flipY, false)
  assert.equal(toHex(view), '0000000000000000000000')
})

test('height', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  assert.equal(draw.h, 0)
  assert.equal(toHex(view), '0000000000000000000000')

  draw.h = 1
  assert.equal(draw.h, 1)
  assert.equal(toHex(view), '0000000000000010000000')

  draw.h = 4095
  assert.equal(draw.h, 4095)
  assert.equal(toHex(view), '00000000000000f0ff0000')

  draw.h = 4096
  assert.equal(draw.h, 0)
  assert.equal(toHex(view), '0000000000000000000000')
})

test('index', () => {
  const draw = new TestDrawable(TestView(), 0)

  assert.equal(draw.i, 0)

  draw.i = 1
  assert.equal(draw.i, 1)
})

test('id', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  assert.equal(draw.id, 0)
  assert.equal(toHex(view), '0000000000000000000000')

  draw.id = 1
  assert.equal(draw.id, 1)
  assert.equal(toHex(view), '0000000000000000002000')

  draw.id = 1023
  assert.equal(draw.id, 1023)
  assert.equal(toHex(view), '000000000000000000e07f')

  draw.id = 1024
  assert.equal(draw.id, 0)
  assert.equal(toHex(view), '0000000000000000000000')
})

test('stretch', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  assert.equal(draw.stretch, false)
  assert.equal(toHex(view), '0000000000000000000000')

  draw.stretch = true
  assert.equal(draw.stretch, true)
  assert.equal(toHex(view), '0000000000800000000000')

  draw.stretch = false
  assert.equal(draw.stretch, false)
  assert.equal(toHex(view), '0000000000000000000000')
})

test('width', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  assert.equal(draw.w, 0)
  assert.equal(toHex(view), '0000000000000000000000')

  draw.w = 1
  assert.equal(draw.w, 1)
  assert.equal(toHex(view), '0000000000000100000000')

  draw.w = 4095
  assert.equal(draw.w, 4095)
  assert.equal(toHex(view), '000000000000ff0f000000')

  draw.w = 4096
  assert.equal(draw.w, 0)
  assert.equal(toHex(view), '0000000000000000000000')
})

test('x', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  draw.x = -65537
  assert.equal(draw.x, 65535)
  assert.equal(toHex(view), 'f8ff070000000000000000')

  draw.x = -65536.125
  assert.equal(draw.x, 65535.875)
  assert.equal(toHex(view), 'ffff070000000000000000')

  draw.x = -65536
  assert.equal(draw.x, -65536)
  assert.equal(toHex(view), '0000080000000000000000')

  draw.x = -0.999
  assert.equal(draw.x, -0.875)
  assert.equal(toHex(view), 'f9ff0f0000000000000000')

  draw.x = -0.875
  assert.equal(draw.x, -0.875)
  assert.equal(toHex(view), 'f9ff0f0000000000000000')

  draw.x = -0.125
  assert.equal(draw.x, -0.125)
  assert.equal(toHex(view), 'ffff0f0000000000000000')

  draw.x = 0
  assert.equal(draw.x, 0)
  assert.equal(toHex(view), '0000000000000000000000')

  draw.x = 0.125
  assert.equal(draw.x, 0.125)
  assert.equal(toHex(view), '0100000000000000000000')

  draw.x = 0.875
  assert.equal(draw.x, 0.875)
  assert.equal(toHex(view), '0700000000000000000000')

  draw.x = 0.999
  assert.equal(draw.x, 0.875)
  assert.equal(toHex(view), '0700000000000000000000')

  draw.x = 1
  assert.equal(draw.x, 1)
  assert.equal(toHex(view), '0800000000000000000000')

  draw.x = 65535.875
  assert.equal(draw.x, 65535.875)
  assert.equal(toHex(view), 'ffff070000000000000000')

  draw.x = 65536
  assert.equal(draw.x, -65536)
  assert.equal(toHex(view), '0000080000000000000000')
})

test('y', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  draw.y = -65537
  assert.equal(draw.y, 65535)
  assert.equal(toHex(view), '000080ff7f000000000000')

  draw.y = -65536.125
  assert.equal(draw.y, 65535.875)
  assert.equal(toHex(view), '0000f0ff7f000000000000')

  draw.y = -65536
  assert.equal(draw.y, -65536)
  assert.equal(toHex(view), '0000000080000000000000')

  draw.y = -0.999
  assert.equal(draw.y, -0.875)
  assert.equal(toHex(view), '000090ffff000000000000')

  draw.y = -0.875
  assert.equal(draw.y, -0.875)
  assert.equal(toHex(view), '000090ffff000000000000')

  draw.y = -0.125
  assert.equal(draw.y, -0.125)
  assert.equal(toHex(view), '0000f0ffff000000000000')

  draw.y = 0
  assert.equal(draw.y, 0)
  assert.equal(toHex(view), '0000000000000000000000')

  draw.y = 0.125
  assert.equal(draw.y, 0.125)
  assert.equal(toHex(view), '0000100000000000000000')

  draw.y = 0.875
  assert.equal(draw.y, 0.875)
  assert.equal(toHex(view), '0000700000000000000000')

  draw.y = 0.999
  assert.equal(draw.y, 0.875)
  assert.equal(toHex(view), '0000700000000000000000')

  draw.y = 1
  assert.equal(draw.y, 1)
  assert.equal(toHex(view), '0000800000000000000000')

  draw.y = 65535.875
  assert.equal(draw.y, 65535.875)
  assert.equal(toHex(view), '0000f0ff7f000000000000')

  draw.y = 65536
  assert.equal(draw.y, -65536)
  assert.equal(toHex(view), '0000000080000000000000')
})

test('z', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  draw.z = 0
  assert.equal(draw.z, 0)
  assert.equal(toHex(view), '0000000000000000000000')

  draw.z = 1
  assert.equal(draw.z, 1)
  assert.equal(toHex(view), '0000000000010000000000')

  draw.z = maxLayer
  assert.equal(draw.z, maxLayer)
  assert.equal(toHex(view), '00000000000f0000000000')

  draw.z = maxLayer + 1
  assert.equal(draw.z, 0)
  assert.equal(toHex(view), '0000000000000000000000')
})

test('zend', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  assert.equal(draw.zend, false)
  assert.equal(toHex(view), '0000000000000000000000')

  draw.zend = true
  assert.equal(draw.zend, true)
  assert.equal(toHex(view), '0000000000100000000000')

  draw.zend = false
  assert.equal(draw.zend, false)
  assert.equal(toHex(view), '0000000000000000000000')
})

test('anim', () => {
  const sprite = new Sprite(TestView(), 0, atlas, {age: 0 as OriginMillis})
  sprite.tag = 'stem--AnimA'
  assert.equal(sprite.anim, animA)
})

test('hitbox', () => {
  const sprite = new Sprite(TestView(), 0, atlas, {age: 0 as OriginMillis})
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
  const sprite = new Sprite(TestView(), 0, atlas, {age: 0 as OriginMillis})
  sprite.tag = 'stem--AnimA'
  assert.equal(sprite.hits({x: 1, y: 2}), true)
  assert.equal(sprite.hits({x: 4, y: 6}), false)
})

test('hurtbox', () => {
  const sprite = new Sprite(TestView(), 0, atlas, {age: 0 as OriginMillis})
  sprite.tag = 'stem--AnimA'
  assert.deepEqual(sprite.hurtbox, {x: 1, y: 2, w: 3, h: 4})
  sprite.flipX = true
  assert.deepEqual(sprite.hurtbox, {x: 6, y: 2, w: 3, h: 4})
  sprite.flipY = true
  assert.deepEqual(sprite.hurtbox, {x: 6, y: 14, w: 3, h: 4})
})

test('looped', () => {
  const framer = {age: 0 as OriginMillis}
  const sprite = new Sprite(TestView(), 0, atlas, framer)

  sprite.tag = 'stem--AnimA'
  for (let i = 0; i < maxAnimCels * 5; i++) {
    framer.age = (celMillis * i) as OriginMillis
    assert.equal(sprite.looped, i % (animA.cels * 2) >= animA.cels, `${i}`)
  }

  framer.age = 0 as OriginMillis
  sprite.tag = 'stem--AnimB'
  for (let i = 0; i < maxAnimCels * 5; i++) {
    framer.age = (celMillis * i) as OriginMillis
    assert.equal(sprite.looped, i % (animB.cels * 2) >= animB.cels, `${i}`)
  }

  framer.age = (celMillis * (maxAnimCels + 0)) as OriginMillis
  sprite.tag = 'stem--AnimB'
  assert.equal(sprite.looped, false)

  for (let i = 0; i < maxAnimCels - 1; i++) {
    framer.age = (celMillis * (maxAnimCels + i)) as OriginMillis
    assert.equal(sprite.looped, false, `${i}`)
  }

  framer.age = (celMillis * (maxAnimCels + maxAnimCels)) as OriginMillis
  assert.equal(sprite.looped, true)
})

test('reset()', () => {
  const framer = {age: 0 as OriginMillis}
  const sprite = new Sprite(TestView(), 0, atlas, framer)
  sprite.tag = 'stem--AnimA'

  for (let i = 0; i < maxAnimCels * 5; i++) {
    framer.age = (celMillis * i) as OriginMillis
    sprite.reset()
    assert.equal(sprite.cel, i % (2 * sprite.anim.cels), `${i}`)
  }
})

test('tag', () => {
  const framer = {age: 0 as OriginMillis}
  const sprite = new Sprite(TestView(), 0, atlas, framer)
  sprite.tag = 'stem--AnimA'
  assert.equal(sprite.w, 10)
  assert.equal(sprite.h, 20)
  assert.equal(sprite.id, 0)
  assert.equal(sprite.cel, 0)
  framer.age = (celMillis * 1) as OriginMillis
  sprite.tag = 'stem--AnimB'
  assert.equal(sprite.w, 30)
  assert.equal(sprite.h, 40)
  assert.equal(sprite.id, 1)
  assert.equal(sprite.cel, 1)
})

test('toString()', () => {
  const sprite = new Sprite(TestView(), 0, atlas, {age: 0 as OriginMillis})
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

function TestView(): DataView {
  return new DataView(new ArrayBuffer(drawableBytes), 0, drawableBytes)
}

function toHex(view: Readonly<DataView>): string {
  return [...new Uint8Array(view.buffer)]
    .map(v => v.toString(16).padStart(2, '0'))
    .join('')
}
