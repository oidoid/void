import { XY } from '@/ooz'
import {
  Layer,
  parseWrapLayerByHeightLayer,
  serializeWrapLayerByHeightLayer,
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

// to-do: sprite intersect tests.
