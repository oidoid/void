import { assertEquals } from '@std/assert'
import {
  xyAdd,
  xyAddTo,
  xyDistance,
  xyDiv,
  xyMagnitude,
  xyStr,
  xySub
} from './geo.ts'

Deno.test('xyAdd()', () =>
  assertEquals(xyAdd({x: 1, y: 2}, {x: 3, y: 4}), {x: 4, y: 6}))

Deno.test('xyAddTo()', () => {
  const xy = {x: 1, y: 2}
  xyAddTo(xy, {x: 3, y: 4})
  assertEquals(xy, {x: 4, y: 6})
})

Deno.test('xyDistance()', () =>
  assertEquals(xyDistance({x: 1, y: 2}, {x: 6, y: 14}), 13))

Deno.test('xyDiv()', () =>
  assertEquals(xyDiv({x: 1, y: 2}, {x: 3, y: 4}), {x: 1 / 3, y: 2 / 4}))

Deno.test('xyMagnitude()', () => assertEquals(xyMagnitude({x: 3, y: 4}), 5))

Deno.test('xyStr()', () => assertEquals(xyStr({x: 1, y: 2}), '(1, 2)'))

Deno.test('xySub()', () =>
  assertEquals(xySub({x: 1, y: 2}, {x: 3, y: 4}), {x: -2, y: -2}))
