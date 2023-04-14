import { CelID, Film } from '@/atlas-pack'
import { Box, XY } from '@/ooz'
import {
  Layer,
  parseWrapLayerByHeightLayer,
  serializeWrapLayerByHeightLayer,
  Sprite,
} from '@/void'
import { assertEquals } from 'std/testing/asserts.ts'

Deno.test('serializeWrapLayerByHeightLayer', () => {
  assertEquals(
    serializeWrapLayerByHeightLayer(new XY(1, 2), true, Layer.Bottom),
    0b0001_0010_1_1000000,
  )
  assertEquals(
    serializeWrapLayerByHeightLayer(new XY(-1, -2), false, Layer.Top),
    0b1111_1110_0_0000001,
  )
})

Deno.test('parseWrapLayerByHeightLayer', () => {
  assertEquals(
    parseWrapLayerByHeightLayer(0b0001_0010_1_1000000),
    { wrap: new XY(1, 2), layerByHeight: true, layer: Layer.Bottom },
  )
  assertEquals(
    parseWrapLayerByHeightLayer(0b1111_1110_0_0000001),
    { wrap: new XY(-1, -2), layerByHeight: false, layer: Layer.Top },
  )
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
