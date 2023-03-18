import { I16, I16Box, NumXY, U16XY } from '@/ooz'
import { Viewport } from '@/void'
import { assertEquals } from 'std/testing/asserts.ts'

Deno.test('Viewport', () => {
  const clientViewportWH = new NumXY(162.1999969482422, 88.80000305175781)
  const devicePixelRatio = 5
  const minViewportWH = new U16XY(400, 128)

  const nativeViewportWH = Viewport.nativeViewportWH(
    { devicePixelRatio } as Window,
    clientViewportWH,
  )
  assertEquals(nativeViewportWH.x, 811)
  assertEquals(nativeViewportWH.y, 444)

  const scale = Viewport.scale(nativeViewportWH, minViewportWH, I16(0))
  assertEquals(scale, 2)

  const camWH = Viewport.camWH(nativeViewportWH, scale)
  assertEquals(camWH.x, 405) // division is fractional, level px
  assertEquals(camWH.y, 222)

  const nativeCanvasWH = Viewport.nativeCanvasWH(camWH, scale)
  assertEquals(nativeCanvasWH.x, 810) // must be an integer multiple of camWH >= 1
  assertEquals(nativeCanvasWH.y, 444)

  const clientCanvasWH = Viewport.clientCanvasWH(
    { devicePixelRatio } as Window,
    nativeCanvasWH,
  )
  assertEquals(clientCanvasWH.x, 162)
  assertEquals(clientCanvasWH.y, 88.8)

  const xy = Viewport.toLevelXY(
    new NumXY(137.40000915527344, 48.400001525878906),
    clientViewportWH,
    new I16Box(0, 0, camWH.x, camWH.y),
  )
  assertEquals(xy.x, 343)
  assertEquals(xy.y, 120)
})
