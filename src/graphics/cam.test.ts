import {afterEach, test} from 'node:test'
import {assert} from '../test/assert.ts'
import {Cam, type Canvas} from './cam.ts'
import {Layer} from './layer.ts'

afterEach(() => (globalThis.devicePixelRatio = 1))

test('update() in int mode sizes canvas with devicePixelRatio and minWH', () => {
  globalThis.devicePixelRatio = 5

  const cam = new Cam()
  cam.minWH = {w: 400, h: 128}
  const canvas = TestCanvas(162.1999969482422, 88.80000305175781)
  cam.update(canvas)

  assert(canvas.width, 406)
  assert(canvas.height, 223)
  assert(canvas.style.width, '162.4px')
  assert(canvas.style.height, '89.2px')

  assert(cam.scale, 2)
  assert(cam.w, 406)
  assert(cam.h, 223)
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
  assert(cam.clientToXYLocal(xyClient), expectedLocal)
  assert(cam.clientToXY(xyClient), expectedLocal)

  // with cam offset: world position shifts, local remains unchanged.
  cam.x = 10
  cam.y = 100
  assert(cam.clientToXYLocal(xyClient), expectedLocal)
  assert(cam.clientToXY(xyClient), {
    x: expectedLocal.x + cam.x,
    y: expectedLocal.y + cam.y
  })
})

test('toString()', () => {
  const cam = new Cam()
  const canvas = TestCanvas(3, 4)
  cam.x = 1
  cam.y = 2
  cam.update(canvas)
  assert(cam.toString(), `Cam{(1 2) 3×4}`)
})

test('invalid is true initially, after first update(), but not after postupdate()', () => {
  const cam = new Cam()
  const canvas = TestCanvas(200, 100)

  assert(cam.invalid, true)
  cam.update(canvas)
  assert(cam.invalid, true)
  cam.postupdate()
  assert(cam.invalid, false)
})

test('x/y invalidation', () => {
  const cam = new Cam()
  const canvas = TestCanvas(200, 100)

  cam.update(canvas)
  cam.postupdate()
  cam.x = 0
  assert(cam.invalid, false)

  cam.x = 5
  assert(cam.invalid, true)

  cam.update(canvas)
  cam.postupdate()
  cam.y = 0
  assert(cam.invalid, false)

  cam.y = 5
  assert(cam.invalid, true)
})

test('minWH invalidation)', () => {
  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  const canvas = TestCanvas(200, 100)

  cam.update(canvas)
  cam.postupdate()

  cam.minWH = {w: 100, h: 50}
  assert(cam.invalid, false)

  cam.minWH = {w: 200, h: 50}
  assert(cam.invalid, true)

  cam.update(canvas)
  cam.postupdate()

  cam.minWH = {w: 200, h: 100}
  assert(cam.invalid, true)
})

test('mode invalidation)', () => {
  const cam = new Cam()
  const canvas = TestCanvas(200, 100)

  cam.update(canvas)
  cam.postupdate()

  cam.mode = 'Int'
  assert(cam.invalid, false)

  cam.mode = 'Float'
  assert(cam.invalid, true)
})

test('devicePixelRatio change invalidates on update', () => {
  const cam = new Cam()
  const canvas = TestCanvas(200, 100)

  cam.update(canvas)
  cam.postupdate()

  globalThis.devicePixelRatio = 2
  cam.update(canvas)
  assert(cam.invalid, true)
})

test('center() places cam to center the given xy', () => {
  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  const canvas = TestCanvas(200, 100)
  cam.update(canvas)

  cam.center({x: 63, y: 85})
  assert(cam.x, 13) // floor(63 - 100/2)
  assert(cam.y, 60) // floor(85 - 50/2)
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
  assert(box, {x: 10, y: 20, w: 10, h: 10})
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
  assert(box, {x: 100, y: 60, w: 10, h: 10})
})

test('follow() Origin pivot with modulo snapping', () => {
  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  const canvas = TestCanvas(200, 100)
  cam.update(canvas)
  cam.postupdate()
  cam.x = 10
  cam.y = 20

  const box = cam.follow({w: 10, h: 10}, Layer.A, 'Center', {
    modulo: {x: 16, y: 8}
  })
  assert(box, {x: 48, y: 40, w: 10, h: 10})
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
    margin: {n: 2, s: 2, w: 3, e: 3}
  })
  assert(box, {x: 13, y: 22, w: 94, h: 46})
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
  assert(box, {x: 90, y: 40, w: 10, h: 10})
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
  assert(cam.isVisible({x: 9, y: 20, w: 1, h: 1}), false)

  // point inside (defaults to 1x1).
  assert(cam.isVisible({x: 10, y: 20}), true)

  // outside to the right.
  assert(cam.isVisible({x: 110, y: 20, w: 1, h: 1}), false)

  // partial overlap.
  assert(cam.isVisible({x: 5, y: 0, w: 10, h: 30}), true)
})

test('portrait()', () => {
  const cam = new Cam()
  const canvas = TestCanvas(100, 200)
  cam.update(canvas)
  assert(cam.portrait, true)

  canvas.parentElement.clientWidth = 300
  cam.update(canvas)
  assert(cam.portrait, false)
})

test('zoom out int mode affects scale and dims', () => {
  globalThis.devicePixelRatio = 2

  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  cam.zoomOut = 1.2 // truncates to 1 in int mode.
  const canvas = TestCanvas(200, 100)
  cam.update(canvas)

  assert(cam.scale, 3)
  assert(cam.w, 134)
  assert(cam.h, 67)
})

test('negative zoom in int mode is clamped to 0', () => {
  globalThis.devicePixelRatio = 2

  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  const canvas = TestCanvas(200, 100)

  cam.zoomOut = -10
  cam.update(canvas)
  assert(cam.scale, 4)
})

test('zoom out in float mode subtracts fractionally', () => {
  globalThis.devicePixelRatio = 2

  const cam = new Cam()
  cam.minWH = {w: 100, h: 50}
  cam.mode = 'Float'
  cam.zoomOut = 1.2
  const canvas = TestCanvas(200, 100)
  cam.update(canvas)

  assert(Math.abs(cam.scale - 2.8) < 1e-12, true)
  assert(cam.w, 143)
  assert(cam.h, 72)
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
