import { assertEquals, assertStrictEquals } from 'std/testing/asserts.ts'
import { Cam } from './cam.ts'

Deno.test('Cam', () => {
  globalThis.innerWidth = 162.1999969482422
  globalThis.innerHeight = 88.80000305175781
  globalThis.devicePixelRatio = 5
  const cam = new Cam()
  cam.minWH.w = 400
  cam.minWH.h = 128
  cam.resize()

  assertStrictEquals(cam.scale, 2)
  assertStrictEquals(cam.w, 405)
  assertStrictEquals(cam.h, 222)

  assertEquals(
    cam.toLevelXY({ x: 137.40000915527344, y: 48.400001525878906 }),
    { x: 343, y: 121 },
  )
})
