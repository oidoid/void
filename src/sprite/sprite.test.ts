import { CelID, Film } from '@/atlas-pack'
import { Box, XY } from '@/ooz'
import { Layer, Sprite } from '@/void'
import { assertEquals } from 'std/testing/asserts.ts'

Deno.test('bits', () => {
  const film: Film = {
    id: 'filename--Tag',
    wh: new XY(3, 4),
    cels: [
      {
        id: <CelID> 0,
        bounds: new Box(1, 2, 3, 4),
        duration: 1,
        sliceBounds: new Box(0, 0, 2, 2),
        slices: [new Box(0, 0, 2, 2)],
      },
    ],
    sliceBounds: new Box(0, 0, 2, 2),
    period: 1,
    duration: 1,
    direction: 'Forward',
    loops: 1,
  }
  const sprite = new Sprite(film, 0)
  sprite.flipX = true
  assertEquals(sprite.flipX, true)
  sprite.flipY = true
  assertEquals(sprite.flipY, true)
  sprite.wrapX = 1
  assertEquals(sprite.wrapX, 1)
  sprite.wrapY = 2
  assertEquals(sprite.wrapY, 2)
  sprite.anchorEnd = true
  assertEquals(sprite.anchorEnd, true)
  sprite.layer = Layer.Bottom
  assertEquals(sprite.layer, Layer.Bottom)
  assertEquals(sprite.flipWrapAnchorLayer, 0b1_1_0001_0010_1_1000000)

  sprite.flipX = false
  assertEquals(sprite.flipX, false)
  sprite.flipY = false
  assertEquals(sprite.flipY, false)
  sprite.wrapX = -1
  assertEquals(sprite.wrapX, -1)
  sprite.wrapY = -2
  assertEquals(sprite.wrapY, -2)
  sprite.anchorEnd = false
  assertEquals(sprite.anchorEnd, false)
  sprite.layer = Layer.Top
  assertEquals(sprite.layer, Layer.Top)
  assertEquals(sprite.flipWrapAnchorLayer, 0b0_0_1111_1110_0_0000001)
})

Deno.test('hits', () => {
  const film: Film = {
    id: 'filename--Tag',
    wh: new XY(3, 4),
    cels: [
      {
        id: <CelID> 0,
        bounds: new Box(1, 2, 3, 4),
        duration: 1,
        sliceBounds: new Box(0, 0, 2, 2),
        slices: [new Box(0, 0, 2, 2)],
      },
    ],
    sliceBounds: new Box(0, 0, 2, 2),
    period: 1,
    duration: 1,
    direction: 'Forward',
    loops: 1,
  }
  const sprite = new Sprite(film, 0)
  sprite.x = 10
  sprite.y = 100

  assertEquals(sprite.hits(new XY(11, 101)), true)
  assertEquals(sprite.hits(new XY(15, 101)), false)

  assertEquals(sprite.hits(new Box(11, 101, 1, 1)), true)
  assertEquals(sprite.hits(new Box(15, 101, 1, 1)), false)

  const other = new Sprite(film, 0)
  other.x = 11
  other.y = 101
  assertEquals(sprite.hits(other), true)
  assertEquals(other.hits(sprite), true)
  other.x = 15
  assertEquals(sprite.hits(other), false)
  assertEquals(other.hits(sprite), false)
})
