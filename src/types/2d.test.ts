import { assertEquals } from '@std/assert'
import { xyAddTo, xyDiv } from './2d.ts'

Deno.test('xyAddTo()', () => {
  const xy = {x: 1, y: 2}
  xyAddTo(xy, {x: 3, y: 4})
  assertEquals(xy, {x: 4, y: 6})
})

Deno.test('xyDiv()', () => {
  const xy = xyDiv({x: 1, y: 2}, {x: 3, y: 4})
  assertEquals(xy, {x: 1 / 3, y: 2 / 4})
})
