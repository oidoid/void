import assert from 'node:assert/strict'
import {test} from 'node:test'
import {Cam} from './cam.ts'

test('cam', () => {
  globalThis.devicePixelRatio = 5 // to-do: will I get resize event when this changes?

  const cam = new Cam()
  cam.minWH = {w: 400, h: 128}
  cam.mode = 'Int'
  const canvas = {
    width: 0,
    height: 0,
    style: {width: '', height: ''},
    parentElement: {
      clientWidth: 162.1999969482422,
      clientHeight: 88.80000305175781
    }
  }
  cam.update(canvas)

  assert.equal(canvas.width, 406)
  assert.equal(canvas.height, 223)
  assert.equal(canvas.style.width, '162.4px')
  assert.equal(canvas.style.height, '89.2px')

  assert.equal(cam.scale, 2)
  assert.equal(cam.w, 406)
  assert.equal(cam.h, 223)

  const xyClient = {x: 137.40000915527344, y: 48.400001525878906}
  assert.deepEqual(cam.clientToXY(xyClient), {
    x: 343.9235805586467,
    y: 121.54504469983058
  })
  assert.deepEqual(cam.clientToXYLocal(xyClient), {
    x: 343.9235805586467,
    y: 121.54504469983058
  })

  cam.x = 10
  cam.y = 100
  assert.deepEqual(cam.clientToXY(xyClient), {
    x: 353.9235805586467,
    y: 221.54504469983058
  })
  assert.deepEqual(cam.clientToXYLocal(xyClient), {
    x: 343.9235805586467,
    y: 121.54504469983058
  })
})

test('toString()', () => {
  const cam = new Cam()
  assert.equal(cam.toString(), `Cam{(0 0) 1×1}`)
})
