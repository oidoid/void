import { Box, XY } from '@/ooz'
import {
  camWH,
  clientCanvasWH,
  nativeCanvasWH,
  nativeViewportWH,
  viewportScale,
  viewportToLevelXY,
} from '@/void'
import { assertEquals } from 'std/testing/asserts.ts'

Deno.test('Viewport', () => {
  const clientViewportWH = new XY(162.1999969482422, 88.80000305175781)
  const devicePixelRatio = 5
  const minViewportWH = new XY(400, 128)

  const nativeViewWH = nativeViewportWH(
    { devicePixelRatio } as Window,
    clientViewportWH,
  )
  assertEquals(nativeViewWH.x, 811)
  assertEquals(nativeViewWH.y, 444)

  const scale = viewportScale(nativeViewWH, minViewportWH, 0)
  assertEquals(scale, 2)

  const cWH = camWH(nativeViewWH, scale)
  assertEquals(cWH.x, 405) // division is fractional, level px
  assertEquals(cWH.y, 222)

  const nativeCanWH = nativeCanvasWH(cWH, scale)
  assertEquals(nativeCanWH.x, 810) // must be an integer multiple of camWH >= 1
  assertEquals(nativeCanWH.y, 444)

  const clientCanWH = clientCanvasWH(
    { devicePixelRatio } as Window,
    nativeCanWH,
  )
  assertEquals(clientCanWH.x, 162)
  assertEquals(clientCanWH.y, 88.8)

  const xy = viewportToLevelXY(
    new XY(137.40000915527344, 48.400001525878906),
    clientViewportWH,
    new Box(0, 0, cWH.x, cWH.y),
  )
  assertEquals(xy.x, 343.0764781434776)
  assertEquals(xy.y, 120.99999965633359)
})
