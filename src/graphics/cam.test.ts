import assert from 'node:assert/strict'
import {afterEach, test} from 'node:test'
import {Cam, type Canvas} from './cam.ts'
import {Layer} from './layer.ts'

afterEach(() => (globalThis.devicePixelRatio = 1))

test('update() in int mode sizes canvas with devicePixelRatio and minWH', () => {
  globalThis.devicePixelRatio = 5

  const cam = new Cam()
  cam.minWH = {w: 400, h: 128}
  const canvas = TestCanvas(162.1999969482422, 88.80000305175781)
  cam.update(canvas)

  assert.equal(canvas.width, 406)
  assert.equal(canvas.height, 223)
  assert.equal(canvas.style.width, '162.4px')
  assert.equal(canvas.style.height, '89.2px')

  assert.equal(cam.scale, 2)
  assert.equal(cam.w, 406)
  assert.equal(cam.h, 223)
})

test('clientToXY() and clientToXYLocal()', () => {
  globalThis.devicePixelRatio = 5

  const cam = new Cam()
  cam.minWH = {w: 400, h: 128}
  const canvas = TestCanvas(162.1999969482422, 88.80000305175781)
  cam.update(canvas)

  const xyClient = {x: 137.40000915527344, y: 48.400001525878906}
  const expectedLocal = {x: 343.9235805586467, y: 121.54504469983058}

  // at origin: both world and local are the same.
  assert.deepEqual(cam.clientToXYLocal(xyClient), expectedLocal)
  assert.deepEqual(cam.clientToXY(xyClient), expectedLocal)

  // with cam offset: world position shifts, local remains unchanged.
  cam.x = 10
  cam.y = 100
  assert.deepEqual(cam.clientToXYLocal(xyClient), expectedLocal)
  assert.deepEqual(cam.clientToXY(xyClient), {
    x: 353.9235805586467,
    y: 221.54504469983058
  })
})

test('toString()', () => {
  const cam = new Cam()
  const canvas = TestCanvas(3, 4)
  cam.x = 1
  cam.y = 2
  cam.update(canvas)
  assert.equal(cam.toString(), `Cam{(1 2) 3×4}`)
})

test('invalid is true initially, after first update(), but not after postupdate()', () => {
  const cam = new Cam()
  const canvas = TestCanvas(200, 100)

  assert.equal(cam.invalid, true)
  cam.update(canvas)
  assert.equal(cam.invalid, true)
  cam.postupdate()
  assert.equal(cam.invalid, false)
})

test('x/y invalidation', () => {
  const cam = new Cam()
  const canvas = TestCanvas(200, 100)

  cam.update(canvas)
  cam.postupdate()
  cam.x = 0
  assert.equal(cam.invalid, false)

  cam.x = 5
  assert.equal(cam.invalid, true)

  cam.update(canvas)
  cam.postupdate()
  cam.y = 0
  assert.equal(cam.invalid, false)

  cam.y = 5
  assert.equal(cam.invalid, true)
})

test('minWH invalidation)', () => {
  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  const canvas = TestCanvas(200, 100)

  cam.update(canvas)
  cam.postupdate()

  cam.minWH = {w: 100, h: 50}
  assert.equal(cam.invalid, false)

  cam.minWH = {w: 200, h: 50}
  assert.equal(cam.invalid, true)

  cam.update(canvas)
  cam.postupdate()

  cam.minWH = {w: 200, h: 100}
  assert.equal(cam.invalid, true)
})

test('mode invalidation)', () => {
  const cam = new Cam()
  const canvas = TestCanvas(200, 100)

  cam.update(canvas)
  cam.postupdate()

  cam.mode = 'Int'
  assert.equal(cam.invalid, false)

  cam.mode = 'Float'
  assert.equal(cam.invalid, true)
})

test('devicePixelRatio change invalidates on update', () => {
  const cam = new Cam()
  const canvas = TestCanvas(200, 100)

  cam.update(canvas)
  cam.postupdate()

  globalThis.devicePixelRatio = 2
  cam.update(canvas)
  assert.equal(cam.invalid, true)
})

test('center() places cam to center the given xy', () => {
  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  const canvas = TestCanvas(200, 100)
  cam.update(canvas)

  cam.center({x: 63, y: 85})
  assert.equal(cam.x, 13) // floor(63 - 100/2)
  assert.equal(cam.y, 60) // floor(85 - 50/2)
})

test('follow() NW pivot (world layer)', () => {
  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  const canvas = TestCanvas(200, 100)
  cam.update(canvas)
  cam.postupdate()
  cam.x = 10
  cam.y = 20

  const box = cam.follow({w: 10, h: 10}, Layer.A, 'NW')
  assert.deepEqual(box, {x: 10, y: 20, w: 10, h: 10})
})

test('follow() SE pivot (world layer)', () => {
  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  const canvas = TestCanvas(200, 100)
  cam.update(canvas)
  cam.postupdate()
  cam.x = 10
  cam.y = 20

  const box = cam.follow({w: 10, h: 10}, Layer.A, 'SE')
  assert.deepEqual(box, {x: 100, y: 60, w: 10, h: 10})
})

test('follow() Origin pivot with modulo snapping', () => {
  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  const canvas = TestCanvas(200, 100)
  cam.update(canvas)
  cam.postupdate()
  cam.x = 10
  cam.y = 20

  const box = cam.follow({w: 10, h: 10}, Layer.A, 'Origin', {
    modulo: {x: 16, y: 8}
  })
  assert.deepEqual(box, {x: 48, y: 40, w: 10, h: 10})
})

test('follow() fill XY with margins', () => {
  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  const canvas = TestCanvas(200, 100)
  cam.update(canvas)
  cam.postupdate()
  cam.x = 10
  cam.y = 20

  const box = cam.follow({w: 10, h: 10}, Layer.A, 'NW', {
    fill: 'XY',
    margin: {w: 2, h: 3}
  })
  assert.deepEqual(box, {x: 12, y: 23, w: 96, h: 44})
})

test('follow() UI layer ignores cam offset', () => {
  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  const canvas = TestCanvas(200, 100)
  cam.update(canvas)
  cam.postupdate()
  cam.x = 10
  cam.y = 20

  const box = cam.follow({w: 10, h: 10}, Layer.UIA, 'SE')
  assert.deepEqual(box, {x: 90, y: 40, w: 10, h: 10})
})

test('isVisible() cases', () => {
  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  const canvas = TestCanvas(200, 100)
  cam.update(canvas)
  cam.postupdate()
  cam.x = 10
  cam.y = 20

  // outside to the left (touching edge is not visible).
  assert.equal(cam.isVisible({x: 9, y: 20, w: 1, h: 1}), false)

  // point inside (defaults to 1x1).
  assert.equal(cam.isVisible({x: 10, y: 20}), true)

  // outside to the right.
  assert.equal(cam.isVisible({x: 110, y: 20, w: 1, h: 1}), false)

  // partial overlap.
  assert.equal(cam.isVisible({x: 5, y: 0, w: 10, h: 30}), true)
})

test('portrait()', () => {
  const cam = new Cam()
  const canvas = TestCanvas(100, 200)
  cam.update(canvas)
  assert.equal(cam.portrait, true)

  canvas.parentElement.clientWidth = 300
  cam.update(canvas)
  assert.equal(cam.portrait, false)
})

test('zoom out int mode affects scale and dims', () => {
  globalThis.devicePixelRatio = 2

  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  cam.zoomOut = 1.2 // truncates to 1 in int mode.
  const canvas = TestCanvas(200, 100)
  cam.update(canvas)

  assert.equal(cam.scale, 3)
  assert.equal(cam.w, 134)
  assert.equal(cam.h, 67)
})

test('negative zoom in int mode is clamped to 0', () => {
  globalThis.devicePixelRatio = 2

  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  const canvas = TestCanvas(200, 100)

  cam.zoomOut = -10
  cam.update(canvas)
  assert.equal(cam.scale, 4)
})

test('zoom out in float mode subtracts fractionally', () => {
  globalThis.devicePixelRatio = 2

  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  cam.mode = 'Float'
  cam.zoomOut = 1.2
  const canvas = TestCanvas(200, 100)
  cam.update(canvas)

  assert.ok(Math.abs(cam.scale - 2.8) < 1e-12)
  assert.equal(cam.w, 143)
  assert.equal(cam.h, 72)
})

function TestCanvas(
  clientWidth: number,
  clientHeight: number
): Canvas & {parentElement: {clientWidth: number; clientHeight: number}} {
  return {
    width: 0,
    height: 0,
    style: {width: '', height: ''},
    parentElement: {clientWidth, clientHeight}
  }
}
