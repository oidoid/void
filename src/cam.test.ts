import { assertEquals } from '@std/assert'
import { Cam } from './cam.ts'

Deno.test('cam', () => {
  globalThis.devicePixelRatio = 5 // to-do: will I get resize event when this changes?

  const cam = new Cam()
  cam.clientWH = {w: 162.1999969482422, h: 88.80000305175781}
  cam.minWH = {w: 400, h: 128}
  cam.mode = 'Int'

  assertEquals(cam.scale, 2)
  assertEquals(cam.w, 406)
  assertEquals(cam.h, 223)

  const clientXY = {x: 137.40000915527344, y: 48.400001525878906}
  assertEquals(
    cam.toXY(clientXY),
    {x: 343.9235805586467, y: 121.54504469983058}
  )
  assertEquals(
    cam.toCanvasXY(clientXY),
    {x: 343.9235805586467, y: 121.54504469983058}
  )

  cam.x = 10
  cam.y = 100
  assertEquals(
    cam.toXY(clientXY),
    {x: 353.9235805586467, y: 221.54504469983058}
  )
  assertEquals(
    cam.toCanvasXY(clientXY),
    {x: 343.9235805586467, y: 121.54504469983058}
  )
})
