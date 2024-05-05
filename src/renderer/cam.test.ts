import {expect, test} from 'vitest'
import {Cam} from './cam.js'

test('Cam', () => {
  globalThis.innerWidth = 162.1999969482422
  globalThis.innerHeight = 88.80000305175781
  globalThis.devicePixelRatio = 5
  const cam = new Cam()
  cam.minWH.w = 400
  cam.minWH.h = 128
  cam.resize()

  expect(cam.scale).toBe(2)
  expect(cam.w).toBe(405)
  expect(cam.h).toBe(222)

  expect(
    cam.toLevelXY({x: 137.40000915527344, y: 48.400001525878906})
  ).toStrictEqual({x: 343, y: 121})
})
