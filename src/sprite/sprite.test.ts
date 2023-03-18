import { I4XY, U16 } from '@/ooz'
import {
  Layer,
  parseWrapLayerByHeightLayer,
  serializeWrapLayerByHeightLayer,
} from '@/void'
import { assertEquals } from 'std/testing/asserts.ts'

Deno.test('serializeWrapLayerByHeightLayer', () => {
  assertEquals(
    serializeWrapLayerByHeightLayer(new I4XY(1, 2), true, Layer.Bottom),
    0b0001_0010_1_1000000,
  )
  assertEquals(
    serializeWrapLayerByHeightLayer(new I4XY(-1, -2), false, Layer.Top),
    0b1111_1110_0_0000001,
  )
})

Deno.test('parseWrapLayerByHeightLayer', () => {
  assertEquals(
    parseWrapLayerByHeightLayer(U16(0b0001_0010_1_1000000)),
    { wrap: new I4XY(1, 2), layerByHeight: true, layer: Layer.Bottom },
  )
  assertEquals(
    parseWrapLayerByHeightLayer(U16(0b1111_1110_0_0000001)),
    { wrap: new I4XY(-1, -2), layerByHeight: false, layer: Layer.Top },
  )
})
