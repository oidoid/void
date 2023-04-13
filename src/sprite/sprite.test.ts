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

Deno.test('intersects', () => {
  const film: Film = {
    id: 'filename--Tag',
    wh: new XY(3, 4),
    cels: [
      {
        id: <CelID> 0,
        bounds: new Box(1, 2, 3, 4),
        duration: 1,
        sliceBounds: new Box(1, 1, -1, -1),
        slices: [],
      },
    ],
    period: 1,
    duration: 1,
    direction: 'Forward',
    loops: 1,
  }
  const sprite = new Sprite(film, 0)
  sprite.x = 10
  sprite.y = 100

  assertEquals(sprite.intersects(new XY(11, 101), 0), true)
  assertEquals(sprite.intersects(new XY(15, 101), 0), false)

  assertEquals(sprite.intersects(new Box(11, 101, 1, 1), 0), true)
  assertEquals(sprite.intersects(new Box(15, 101, 1, 1), 0), false)

  const other = new Sprite(film, 0)
  other.x = 11
  other.y = 101
  assertEquals(sprite.intersects(other, 0), true)
  assertEquals(other.intersects(sprite, 0), true)
  other.x = 15
  assertEquals(sprite.intersects(other, 0), false)
  assertEquals(other.intersects(sprite, 0), false)
})
