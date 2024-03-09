import { assertStrictEquals } from 'std/testing/asserts.ts'
import { Anim } from '../atlas/atlas.ts'
import { Sprite } from './sprite.ts'

Deno.test('bits', () => {
  const anim: Anim = {
    id: 0x7ff0,
    w: 1,
    h: 2,
    cels: [{ x: 1, y: 2 }],
    hitbox: { x: 0, y: 0, w: 2, h: 2 },
    tag: 'file--Tag',
  }
  const sprite = new Sprite({ 'file--Tag': anim }, 'file--Tag')
  assertStrictEquals(sprite._iffzz, 0b111111111110000_0_0_0_000)

  assertStrictEquals(sprite.flipX, false)
  sprite.flipX = true
  assertStrictEquals(sprite.flipX, true)
  assertStrictEquals(sprite._iffzz, 0b111111111110000_1_0_0_000)

  assertStrictEquals(sprite.flipY, false)
  sprite.flipY = true
  assertStrictEquals(sprite.flipY, true)
  assertStrictEquals(sprite._iffzz, 0b111111111110000_1_1_0_000)

  assertStrictEquals(sprite.cel, 0)
  sprite.cel = 0xf
  assertStrictEquals(sprite.cel, 0xf)
  assertStrictEquals(sprite._iffzz, 0b111111111111111_1_1_0_000)

  assertStrictEquals(sprite.zend, false)
  sprite.zend = true
  assertStrictEquals(sprite.zend, true)
  assertStrictEquals(sprite._iffzz, 0b111111111111111_1_1_1_000)

  assertStrictEquals(sprite.z, 0)
  sprite.z = 7
  assertStrictEquals(sprite.z, 7)
  assertStrictEquals(sprite._iffzz, 0b111111111111111_1_1_1_111)

  assertStrictEquals(sprite.x, 0)
  sprite.x = 1
  assertStrictEquals(sprite.x, 1)
  sprite.x = 5
  assertStrictEquals(sprite.x, 5)
  assertStrictEquals(sprite._xy >>> 0, 0b0000000000101000_0000000000000000)
  sprite.x = -1
  assertStrictEquals(sprite.x, -1)
  assertStrictEquals(sprite._xy >>> 0, 0b1111111111111000_0000000000000000)
  sprite.x = -2
  assertStrictEquals(sprite.x, -2)
  assertStrictEquals(sprite._xy >>> 0, 0b1111111111110000_0000000000000000)

  assertStrictEquals(sprite.y, 0)
  sprite.y = 1
  assertStrictEquals(sprite.y, 1)
  sprite.y = -1
  assertStrictEquals(sprite.y, -1)
  assertStrictEquals(sprite._xy >>> 0, 0b1111111111110000_1111111111111000)

  for (let x = -4096; x <= 4095; x += .125) {
    sprite.x = x
    assertStrictEquals(sprite.x, x)
  }
  for (let y = -4096; y <= 4095; y += .125) {
    sprite.y = y
    assertStrictEquals(sprite.y, y)
  }
})

Deno.test('hits', () => {
  const anim: Anim = {
    id: 0x7ff0,
    w: 3,
    h: 4,
    cels: [{ x: 1, y: 2 }],
    hitbox: { x: 0, y: 0, w: 2, h: 2 },
    tag: 'file--Tag',
  }
  const sprite = new Sprite({ 'file--Tag': anim }, 'file--Tag')
  sprite.x = 10
  sprite.y = 100

  assertStrictEquals(sprite.hits({ x: 11, y: 101 }), true)
  assertStrictEquals(sprite.hits({ x: 15, y: 101 }), false)

  assertStrictEquals(sprite.hits({ x: 11, y: 101, w: 1, h: 1 }), true)
  assertStrictEquals(sprite.hits({ x: 15, y: 101, w: 1, h: 1 }), false)

  const other = new Sprite({ 'file--Tag': anim }, 'file--Tag')
  other.x = 11
  other.y = 101
  assertStrictEquals(sprite.hits(other), true)
  assertStrictEquals(other.hits(sprite), true)
  other.x = 15
  assertStrictEquals(sprite.hits(other), false)
  assertStrictEquals(other.hits(sprite), false)
})
