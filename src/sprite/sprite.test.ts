import { assertEquals } from 'std/testing/asserts.ts'
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
  assertEquals(sprite._iffzz, 0b111111111110000_0_0_0_000)

  assertEquals(sprite.flipX, false)
  sprite.flipX = true
  assertEquals(sprite.flipX, true)
  assertEquals(sprite._iffzz, 0b111111111110000_1_0_0_000)

  assertEquals(sprite.flipY, false)
  sprite.flipY = true
  assertEquals(sprite.flipY, true)
  assertEquals(sprite._iffzz, 0b111111111110000_1_1_0_000)

  assertEquals(sprite.cel, 0)
  sprite.cel = 0xf
  assertEquals(sprite.cel, 0xf)
  assertEquals(sprite._iffzz, 0b111111111111111_1_1_0_000)

  assertEquals(sprite.zend, false)
  sprite.zend = true
  assertEquals(sprite.zend, true)
  assertEquals(sprite._iffzz, 0b111111111111111_1_1_1_000)

  assertEquals(sprite.z, 0)
  sprite.z = 7
  assertEquals(sprite.z, 7)
  assertEquals(sprite._iffzz, 0b111111111111111_1_1_1_111)

  assertEquals(sprite.x, 0)
  sprite.x = 1
  assertEquals(sprite.x, 1)
  sprite.x = 5
  assertEquals(sprite.x, 5)
  assertEquals(sprite._xy >>> 0, 0b0000000000101000_0000000000000000)
  sprite.x = -1
  assertEquals(sprite.x, -1)
  assertEquals(sprite._xy >>> 0, 0b1111111111111000_0000000000000000)
  sprite.x = -2
  assertEquals(sprite.x, -2)
  assertEquals(sprite._xy >>> 0, 0b1111111111110000_0000000000000000)

  assertEquals(sprite.y, 0)
  sprite.y = 1
  assertEquals(sprite.y, 1)
  sprite.y = -1
  assertEquals(sprite.y, -1)
  assertEquals(sprite._xy >>> 0, 0b1111111111110000_1111111111111000)

  for (let x = -4096; x <= 4095; x += .125) {
    sprite.x = x
    assertEquals(sprite.x, x)
  }
  for (let y = -4096; y <= 4095; y += .125) {
    sprite.y = y
    assertEquals(sprite.y, y)
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

  assertEquals(sprite.hits({ x: 11, y: 101 }), true)
  assertEquals(sprite.hits({ x: 15, y: 101 }), false)

  assertEquals(sprite.hits({ x: 11, y: 101, w: 1, h: 1 }), true)
  assertEquals(sprite.hits({ x: 15, y: 101, w: 1, h: 1 }), false)

  const other = new Sprite({ 'file--Tag': anim }, 'file--Tag')
  other.x = 11
  other.y = 101
  assertEquals(sprite.hits(other), true)
  assertEquals(other.hits(sprite), true)
  other.x = 15
  assertEquals(sprite.hits(other), false)
  assertEquals(other.hits(sprite), false)
})
