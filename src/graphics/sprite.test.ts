import { assertEquals } from '@std/assert'
import { assertInlineSnapshot } from '@std/testing/unstable-snapshot'

import { Drawable, drawableBytes, Sprite } from './sprite.ts'
import { type Anim, type Atlas, celMillis, maxAnimCels } from './atlas.ts'
import type { Millis } from '../types/time.ts'
import { maxLayer } from './layer.ts'

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

Deno.test('above() layer', () => {
  const lhs = new TestDrawable(
    TestView(),
    0
  )
  const rhs = new TestDrawable(TestView(), 0)

  lhs.z = 1
  rhs.z = 2
  assertEquals(lhs.above(rhs), true)
  assertEquals(rhs.above(lhs), false)

  lhs.z = 2
  rhs.z = 2
  assertEquals(lhs.above(rhs), false)
  assertEquals(rhs.above(lhs), false)

  lhs.z = 3
  rhs.z = 2
  assertEquals(lhs.above(rhs), false)
  assertEquals(rhs.above(lhs), true)
})

Deno.test('above() zend', () => {
  const lhs = new TestDrawable(TestView(), 0)
  const rhs = new TestDrawable(TestView(), 0)

  lhs.h = 10
  rhs.h = 100
  assertEquals(lhs.above(rhs), false)
  assertEquals(rhs.above(lhs), false)

  lhs.zend = true
  assertEquals(lhs.above(rhs), true)
  assertEquals(rhs.above(lhs), false)

  rhs.zend = true
  assertEquals(lhs.above(rhs), false)
  assertEquals(rhs.above(lhs), true)
})

Deno.test('cel', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  assertEquals(draw.cel, 0)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)

  draw.cel = 1
  assertEquals(draw.cel, 1)
  assertInlineSnapshot(toHex(view), `"0000000000000000000100"`)

  draw.cel = maxAnimCels
  assertEquals(draw.cel, maxAnimCels)
  assertInlineSnapshot(toHex(view), `"0000000000000000001000"`)

  draw.cel = maxAnimCels * 2 - 1
  assertEquals(draw.cel, maxAnimCels * 2 - 1)
  assertInlineSnapshot(toHex(view), `"0000000000000000001f00"`)

  draw.cel = maxAnimCels * 2
  assertEquals(draw.cel, 0)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)
})

Deno.test('clips()', () => {
  const draw = new TestDrawable(TestView(), 0)
  assertEquals(draw.clips({x: 1, y: 1}), false)

  draw.w = draw.h = 10
  assertEquals(draw.clips({x: 1, y: 1}), true)

  assertEquals(draw.clips({x: 11, y: 11}), false)
})

Deno.test('flipX', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  assertEquals(draw.flipX, false)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)

  draw.flipX = true
  assertEquals(draw.flipX, true)
  assertInlineSnapshot(toHex(view), `"0000000000400000000000"`)

  draw.flipX = false
  assertEquals(draw.flipX, false)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)
})

Deno.test('flipY', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  assertEquals(draw.flipY, false)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)

  draw.flipY = true
  assertEquals(draw.flipY, true)
  assertInlineSnapshot(toHex(view), `"0000000000200000000000"`)

  draw.flipY = false
  assertEquals(draw.flipY, false)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)
})

Deno.test('height', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  assertEquals(draw.h, 0)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)

  draw.h = 1
  assertEquals(draw.h, 1)
  assertInlineSnapshot(toHex(view), `"0000000000000010000000"`)

  draw.h = 4095
  assertEquals(draw.h, 4095)
  assertInlineSnapshot(toHex(view), `"00000000000000f0ff0000"`)

  draw.h = 4096
  assertEquals(draw.h, 0)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)
})

Deno.test('index', () => {
  const draw = new TestDrawable(TestView(), 0)

  assertEquals(draw.i, 0)

  draw.i = 1
  assertEquals(draw.i, 1)
})

Deno.test('id', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  assertEquals(draw.id, 0)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)

  draw.id = 1
  assertEquals(draw.id, 1)
  assertInlineSnapshot(toHex(view), `"0000000000000000002000"`)

  draw.id = 1023
  assertEquals(draw.id, 1023)
  assertInlineSnapshot(toHex(view), `"000000000000000000e07f"`)

  draw.id = 1024
  assertEquals(draw.id, 0)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)
})

Deno.test('stretch', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  assertEquals(draw.stretch, false)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)

  draw.stretch = true
  assertEquals(draw.stretch, true)
  assertInlineSnapshot(toHex(view), `"0000000000800000000000"`)

  draw.stretch = false
  assertEquals(draw.stretch, false)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)
})

Deno.test('width', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  assertEquals(draw.w, 0)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)

  draw.w = 1
  assertEquals(draw.w, 1)
  assertInlineSnapshot(toHex(view), `"0000000000000100000000"`)

  draw.w = 4095
  assertEquals(draw.w, 4095)
  assertInlineSnapshot(toHex(view), `"000000000000ff0f000000"`)

  draw.w = 4096
  assertEquals(draw.w, 0)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)
})

Deno.test('x', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  draw.x = -65537
  assertEquals(draw.x, 65535)
  assertInlineSnapshot(toHex(view), `"f8ff070000000000000000"`)

  draw.x = -65536.125
  assertEquals(draw.x, 65535.875)
  assertInlineSnapshot(toHex(view), `"ffff070000000000000000"`)

  draw.x = -65536
  assertEquals(draw.x, -65536)
  assertInlineSnapshot(toHex(view), `"0000080000000000000000"`)

  draw.x = -.999
  assertEquals(draw.x, -.875)
  assertInlineSnapshot(toHex(view), `"f9ff0f0000000000000000"`)

  draw.x = -.875
  assertEquals(draw.x, -.875)
  assertInlineSnapshot(toHex(view), `"f9ff0f0000000000000000"`)

  draw.x = -.125
  assertEquals(draw.x, -.125)
  assertInlineSnapshot(toHex(view), `"ffff0f0000000000000000"`)

  draw.x = 0
  assertEquals(draw.x, 0)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)

  draw.x = .125
  assertEquals(draw.x, .125)
  assertInlineSnapshot(toHex(view), `"0100000000000000000000"`)

  draw.x = .875
  assertEquals(draw.x, .875)
  assertInlineSnapshot(toHex(view), `"0700000000000000000000"`)

  draw.x = .999
  assertEquals(draw.x, .875)
  assertInlineSnapshot(toHex(view), `"0700000000000000000000"`)

  draw.x = 1
  assertEquals(draw.x, 1)
  assertInlineSnapshot(toHex(view), `"0800000000000000000000"`)

  draw.x = 65535.875
  assertEquals(draw.x, 65535.875)
  assertInlineSnapshot(toHex(view), `"ffff070000000000000000"`)

  draw.x = 65536
  assertEquals(draw.x, -65536)
  assertInlineSnapshot(toHex(view), `"0000080000000000000000"`)
})

Deno.test('y', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  draw.y = -65537
  assertEquals(draw.y, 65535)
  assertInlineSnapshot(toHex(view), `"000080ff7f000000000000"`)

  draw.y = -65536.125
  assertEquals(draw.y, 65535.875)
  assertInlineSnapshot(toHex(view), `"0000f0ff7f000000000000"`)

  draw.y = -65536
  assertEquals(draw.y, -65536)
  assertInlineSnapshot(toHex(view), `"0000000080000000000000"`)

  draw.y = -.999
  assertEquals(draw.y, -.875)
  assertInlineSnapshot(toHex(view), `"000090ffff000000000000"`)

  draw.y = -.875
  assertEquals(draw.y, -.875)
  assertInlineSnapshot(toHex(view), `"000090ffff000000000000"`)

  draw.y = -.125
  assertEquals(draw.y, -.125)
  assertInlineSnapshot(toHex(view), `"0000f0ffff000000000000"`)

  draw.y = 0
  assertEquals(draw.y, 0)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)

  draw.y = .125
  assertEquals(draw.y, .125)
  assertInlineSnapshot(toHex(view), `"0000100000000000000000"`)

  draw.y = .875
  assertEquals(draw.y, .875)
  assertInlineSnapshot(toHex(view), `"0000700000000000000000"`)

  draw.y = .999
  assertEquals(draw.y, .875)
  assertInlineSnapshot(toHex(view), `"0000700000000000000000"`)

  draw.y = 1
  assertEquals(draw.y, 1)
  assertInlineSnapshot(toHex(view), `"0000800000000000000000"`)

  draw.y = 65535.875
  assertEquals(draw.y, 65535.875)
  assertInlineSnapshot(toHex(view), `"0000f0ff7f000000000000"`)

  draw.y = 65536
  assertEquals(draw.y, -65536)
  assertInlineSnapshot(toHex(view), `"0000000080000000000000"`)
})

Deno.test('z', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  draw.z = 0
  assertEquals(draw.z, 0)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)

  draw.z = 1
  assertEquals(draw.z, 1)
  assertInlineSnapshot(toHex(view), `"0000000000010000000000"`)

  draw.z = maxLayer
  assertEquals(draw.z, maxLayer)
  assertInlineSnapshot(toHex(view), `"00000000000f0000000000"`)

  draw.z = maxLayer + 1
  assertEquals(draw.z, 0)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)
})

Deno.test('zend', () => {
  const view = TestView()
  const draw = new TestDrawable(view, 0)

  assertEquals(draw.zend, false)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)

  draw.zend = true
  assertEquals(draw.zend, true)
  assertInlineSnapshot(toHex(view), `"0000000000100000000000"`)

  draw.zend = false
  assertEquals(draw.zend, false)
  assertInlineSnapshot(toHex(view), `"0000000000000000000000"`)
})

Deno.test('anim', () => {
  const sprite = new Sprite(TestView(), 0, atlas, {age: 0 as Millis})
  sprite.tag = 'stem--AnimA'
  assertEquals(sprite.anim, animA)
})

Deno.test('hitbox', () => {
  const sprite = new Sprite(TestView(), 0, atlas, {age: 0 as Millis})
  sprite.tag = 'stem--AnimA'
  assertEquals(sprite.hitbox, {x: 1, y: 2, w: 3, h: 4})
  sprite.flipX = true
  assertEquals(sprite.hitbox, {x: 6, y: 2, w: 3, h: 4})
  sprite.flipY = true
  assertEquals(sprite.hitbox, {x: 6, y: 14, w: 3, h: 4})
  sprite.x = 1
  assertEquals(sprite.hitbox, {x: 7, y: 14, w: 3, h: 4})
  sprite.y = 1
  assertEquals(sprite.hitbox, {x: 7, y: 15, w: 3, h: 4})
})

Deno.test('hits', () => {
  const sprite = new Sprite(TestView(), 0, atlas, {age: 0 as Millis})
  sprite.tag = 'stem--AnimA'
  assertEquals(sprite.hits({x: 1, y: 2}), true)
  assertEquals(sprite.hits({x: 4, y: 6}), false)
})

Deno.test('hurtbox', () => {
  const sprite = new Sprite(TestView(), 0, atlas, {age: 0 as Millis})
  sprite.tag = 'stem--AnimA'
  assertEquals(sprite.hurtbox, {x: 1, y: 2, w: 3, h: 4})
  sprite.flipX = true
  assertEquals(sprite.hurtbox, {x: 6, y: 2, w: 3, h: 4})
  sprite.flipY = true
  assertEquals(sprite.hurtbox, {x: 6, y: 14, w: 3, h: 4})
})

Deno.test('looped', () => {
  const framer = {age: 0 as Millis}
  const sprite = new Sprite(TestView(), 0, atlas, framer)

  sprite.tag = 'stem--AnimA'
  for (let i = 0; i < maxAnimCels * 5; i++) {
    framer.age = celMillis * i as Millis
    assertEquals(sprite.looped, (i % (animA.cels * 2)) >= animA.cels, `${i}`)
  }

  framer.age = 0 as Millis
  sprite.tag = 'stem--AnimB'
  for (let i = 0; i < maxAnimCels * 5; i++) {
    framer.age = celMillis * i as Millis
    assertEquals(sprite.looped, (i % (animB.cels * 2)) >= animB.cels, `${i}`)
  }

  framer.age = celMillis * (maxAnimCels + 0) as Millis
  sprite.tag = 'stem--AnimB'
  assertEquals(sprite.looped, false)

  for (let i = 0; i < (maxAnimCels - 1); i++) {
    framer.age = celMillis * (maxAnimCels + i) as Millis
    assertEquals(sprite.looped, false, `${i}`)
  }

  framer.age = celMillis * (maxAnimCels + maxAnimCels) as Millis
  assertEquals(sprite.looped, true)
})

Deno.test('reset()', () => {
  const framer = {age: 0 as Millis}
  const sprite = new Sprite(TestView(), 0, atlas, framer)
  sprite.tag = 'stem--AnimA'

  for (let i = 0; i < maxAnimCels * 5; i++) {
    framer.age = celMillis * i as Millis
    sprite.reset()
    assertEquals(sprite.cel, i % (2 * sprite.anim.cels), `${i}`)
  }
})

Deno.test('tag', () => {
  const framer = {age: 0 as Millis}
  const sprite = new Sprite(TestView(), 0, atlas, framer)
  sprite.tag = 'stem--AnimA'
  assertEquals(sprite.w, 10)
  assertEquals(sprite.h, 20)
  assertEquals(sprite.id, 0)
  assertEquals(sprite.cel, 0)
  framer.age = celMillis * 1 as Millis
  sprite.tag = 'stem--AnimB'
  assertEquals(sprite.w, 30)
  assertEquals(sprite.h, 40)
  assertEquals(sprite.id, 1)
  assertEquals(sprite.cel, 1)
})

Deno.test('toString()', () => {
  const sprite = new Sprite(TestView(), 0, atlas, {age: 0 as Millis})
  sprite.tag = 'stem--AnimA'
  assertInlineSnapshot(sprite.toString(), `"stem--AnimA (0 0 0) 10×20"`)
  sprite.tag = 'stem--AnimB'
  sprite.x = 1
  sprite.y = 2
  sprite.z = 3
  sprite.w = 4
  sprite.h = 5
  assertInlineSnapshot(sprite.toString(), `"stem--AnimB (1 2 3) 4×5"`)
})

function TestView(): DataView {
  return new DataView(new ArrayBuffer(drawableBytes), 0, drawableBytes)
}

function toHex(view: Readonly<DataView>): string {
  return [...new Uint8Array(view.buffer)].map((v) =>
    v.toString(16).padStart(2, '0')
  ).join('')
}
