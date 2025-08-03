import assert from 'node:assert/strict'
import {test} from 'node:test'
import {
  boxHits,
  xyAdd,
  xyAddTo,
  xyDistance,
  xyDiv,
  xyEq,
  xyMagnitude,
  xyMax,
  xyMin,
  xySub
} from './geo.ts'

test('boxHits()', async ctx => {
  type TestCase = readonly [
    diagram: string,
    l: [x: number, y: number, w: number, h: number],
    r: [x: number, y: number, w: number, h: number],
    hits: boolean
  ]
  // to-do: separate diagram and label.
  const cases: readonly TestCase[] = [
    [
      `
      0   │    Overlapping Square
        ┌─╆━┱─┐
      ──┼─╂L╂R┼
        └─╄━┹─┘
          │
    `,
      [-1, -1, 2, 2],
      [0, -1, 2, 2],
      true
    ],
    [
      `
      1   ├───┐Overlapping Square
        ┌─╆━┓R│
      ──┼─╄L╃─┴
        └─┼─┘
          │
    `,
      [-1, -1, 2, 2],
      [0, -2, 2, 2],
      true
    ],
    [
      `
      2 ┌─R─┐  Overlapping Square
        ┢━┿━┪
      ──┡━┿L┩──
        └─┼─┘
          │
    `,
      [-1, -1, 2, 2],
      [-1, -2, 2, 2],
      true
    ],
    [
      `
      3───┤    Overlapping Square
      │R┏━╅─┐
      ┴─╄━╃L┼──
        └─┼─┘
          │
    `,
      [-1, -1, 2, 2],
      [-2, -2, 2, 2],
      true
    ],
    [
      `
      4   │    Overlapping Square
      ┌─┲━╅─┐
      ┼R╂─╂L┼──
      └─┺━╃─┘
          │
    `,
      [-1, -1, 2, 2],
      [-2, -1, 2, 2],
      true
    ],
    [
      `
      5   │    Overlapping Square
        ┌─┼─┐
      ┬─╆━╅L┼──
      │R┗━╃─┘
      └───┤
    `,
      [-1, -1, 2, 2],
      [-2, 0, 2, 2],
      true
    ],
    [
      `
      6   │    Overlapping Square
        ┌─┼─┐
      ──╆━┿L╅──
        ┡━┿━┩
        └─R─┘
    `,
      [-1, -1, 2, 2],
      [-1, 0, 2, 2],
      true
    ],
    [
      `
      7   │    Overlapping Square
        ┌─┼─┐
      ──┼─╆L╅─┬
        └─╄━┛R│
          ├───┘
    `,
      [-1, -1, 2, 2],
      [0, 0, 2, 2],
      true
    ],
    [
      `
      0 ┌───┼───┐Overlapping Oblong
        │ ┏━┿━┓R│
        └─╄━┿━╃─┘
      ────┼─┼L┼────
          │ │ │
          └─┼─┘
            │
    `,
      [-1, -2, 2, 4],
      [-2, -3, 4, 2],
      true
    ],
    [
      `
      1     │    Overlapping Oblong
          ┌─┼─┐
        ┌─╆━┿━┪─┐
      ──┼─╂─┼L╂R┼──
        └─╄━┿━╃─┘
          └─┼─┘
            │
    `,
      [-1, -2, 2, 4],
      [-2, -1, 4, 2],
      true
    ],
    [
      `
      2     │    Overlapping Oblong
          ┌─┼─┐
          │ │ │
      ────┼─┼L┼────
        ┌─╆━┿━┪─┐
        │ ┗━┿━┛R│
        └───┼───┘
    `,
      [-1, -2, 2, 4],
      [-2, 1, 4, 2],
      true
    ],
    [
      `
      ┌────┼───┐Island
      │┏━┓ │   │
      │┃R┃ │   │
      │┗━┛ │ L │
      ┼────┼───┼
      └────┼───┘
    `,
      [-3, -4, 5, 5],
      [-2, -3, 1, 2],
      true
    ],
    [
      `
          │Identical
        ┏━┿━┓
      ──╂R┼L╂──
        ┗━┿━┛
          │
    `,
      [-1, -1, 2, 2],
      [-1, -1, 2, 2],
      true
    ],
    [
      `
          │Empty
          │
      ────┼────
          │
          │
    `,
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      false
    ],
    [
      `
      0     │      Touching
            │
          ┌─┼─┰───┐
      ────┼─┼L╂──R┼
          └─┼─┸───┘
            │
            │
    `,
      [-1, -1, 2, 2],
      [1, -1, 2, 2],
      false
    ],
    [
      `
      1     │      Touching
            │ ┌───┐
          ┌─┼─┧  R│
      ────┼─┼L╀───┴
          └─┼─┘
            │
            │
    `,
      [-1, -1, 2, 2],
      [1, -2, 2, 2],
      false
    ],
    [
      `
      2     │ ┌───┐Touching
            │ │  R│
          ┌─┼─┼───┘
      ────┼─┼L┼────
          └─┼─┘
            │
            │
    `,
      [-1, -1, 2, 2],
      [1, -3, 2, 2],
      false
    ],
    [
      `
      3     ├───┐Touching
            │  R│
          ┌─┾━┭─┘
      ────┼─┼L┼────
          └─┼─┘
            │
            │
    `,
      [-1, -1, 2, 2],
      [0, -3, 2, 2],
      false
    ],
    [
      `
      4   ┌─┼─┐    Touching
          │ │R│
          ┝━┿━┥
      ────┼─┼L┼───
          └─┼─┘
            │
            │
    `,
      [-1, -1, 2, 2],
      [-1, -3, 2, 2],
      false
    ],
    [
      `
      5 ┌───┼      Touching
        │  R│
        └─┮━┽─┐
      ────┼─┼L┼────
          └─┼─┘
            │
            │
    `,
      [-1, -1, 2, 2],
      [-2, -3, 2, 2],
      false
    ],
    [
      `
      6───┐ │      Touching
      │  R│ │
      └───┼─┼─┐
      ────┼─┼L┼────
          └─┼─┘
            │
            │
    `,
      [-1, -1, 2, 2],
      [-3, -3, 2, 2],
      false
    ],
    [
      `
      7     │      Touching
      ┌───┐ │
      │  R┟─┼─┐
      ┴───╀─┼L┼───
          └─┼─┘
            │
            │
    `,
      [-1, -1, 2, 2],
      [-3, -2, 2, 2],
      false
    ],
    [
      `
      8     │      Touching
            │
      ┌───┰─┼─┐
      ┼──R╂─┼L┼───
      └───┸─┼─┘
            │
            │
    `,
      [-1, -1, 2, 2],
      [-3, -1, 2, 2],
      false
    ],
    [
      `
      9     │      Touching
            │
          ┌─┼─┐
      ┬───╁─┼L┼───
      │  R┞─┼─┘
      └───┘ │
            │
    `,
      [-1, -1, 2, 2],
      [-3, 0, 2, 2],
      false
    ],
    [
      `
      10    │      Touching
            │
          ┌─┼─┐
      ────┼─┼L┼────
      ┌───┼─┼─┘
      │  R│ │
      └───┘ │
    `,
      [-1, -1, 2, 2],
      [-3, 1, 2, 2],
      false
    ],
    [
      `
      11    │      Touching
            │
          ┌─┼─┐
      ────┼─┼L┼────
        ┌─┶━┽─┘
        │  R│
        └───┤
    `,
      [-1, -1, 2, 2],
      [-2, 1, 2, 2],
      false
    ],
    [
      `
      12    │      Touching
            │
          ┌─┼─┐
      ────┼─┼L┼───
          ┝━┿━┥
          │ │R│
          └─┼─┘
    `,
      [-1, -1, 2, 2],
      [-1, 1, 2, 2],
      false
    ],
    [
      `
      13    │      Touching
            │
          ┌─┼─┐
      ────┼─┼L┼────
          └─┾━┵─┐
            │  R│
            ├───┘
    `,
      [-1, -1, 2, 2],
      [0, 1, 2, 2],
      false
    ],
    [
      `
      14    │      Touching
            │
          ┌─┼─┐
      ────┼─┼L┼────
          └─┼─┼───┐
            │ │  R│
            │ └───┘
    `,
      [-1, -1, 2, 2],
      [1, 1, 2, 2],
      false
    ],
    [
      `
      15    │      Touching
            │
          ┌─┼─┐
      ────┼─┼L╁───┬
          └─┼─┦  R│
            │ └───┘
            │
    `,
      [-1, -1, 2, 2],
      [1, 0, 2, 2],
      false
    ],
    [
      `
      0      │    Disjoint
             │
             │
           ┌─┼─┐┌───┐
      ─────┼─┼L┼┼──R┼
           └─┼─┘└───┘
             │
             │
             │
    `,
      [-1, -1, 2, 2],
      [2, -1, 2, 2],
      false
    ],
    [
      `
      1      │    Disjoint
             │
             │  ┌───┐
           ┌─┼─┐│  R│
      ─────┼─┼L┼┴───┴
           └─┼─┘
             │
             │
             │
    `,
      [-1, -1, 2, 2],
      [2, -2, 2, 2],
      false
    ],
    [
      `
      2      ├───┐Disjoint
             │  R│
             ├───┘
           ┌─┼─┐
      ─────┼─┼L┼─────
           └─┼─┘
             │
             │
             │
    `,
      [-1, -1, 2, 2],
      [0, -4, 2, 2],
      false
    ],
    [
      `
      3    ┌─┼─┐  Disjoint
           │ │R│
           └─┼─┘
           ┌─┼─┐
      ─────┼─┼L┼─────
           └─┼─┘
             │
             │
             │
    `,
      [-1, -1, 2, 2],
      [-1, -4, 2, 2],
      false
    ],
    [
      `
      4  ┌───┤    Disjoint
         │  R│
         └───┤
           ┌─┼─┐
      ─────┼─┼L┼─────
           └─┼─┘
             │
             │
             │
    `,
      [-1, -1, 2, 2],
      [-2, -4, 2, 2],
      false
    ],
    [
      `
      5      │    Disjoint
             │
      ┌───┐  │
      │  R│┌─┼─┐
      ┴───┴┼─┼L┼─────
           └─┼─┘
             │
             │
             │
    `,
      [-1, -1, 2, 2],
      [-4, -2, 2, 2],
      false
    ],
    [
      `
      6      │    Disjoint
             │
             │
      ┌───┐┌─┼─┐
      ┼──R┼┼─┼L┼─────
      └───┘└─┼─┘
             │
             │
             │
    `,
      [-1, -1, 2, 2],
      [-4, -1, 2, 2],
      false
    ],
    [
      `
      7      │    Disjoint
             │
             │
           ┌─┼─┐
      ┬───┬┼─┼L┼─────
      │  R│└─┼─┘
      └───┘  │
             │
             │
    `,
      [-1, -1, 2, 2],
      [-4, 0, 2, 2],
      false
    ],
    [
      `
      8      │    Disjoint
             │
             │
           ┌─┼─┐
      ─────┼─┼L┼─────
           └─┼─┘
         ┌───┤
         │  R│
         └───┤
    `,
      [-1, -1, 2, 2],
      [-2, 2, 2, 2],
      false
    ],
    [
      `
      9      │    Disjoint
             │
             │
           ┌─┼─┐
      ─────┼─┼L┼─────
           └─┼─┘
           ┌─┼─┐
           │ │R│
           └─┼─┘
    `,
      [-1, -1, 2, 2],
      [-1, 2, 2, 2],
      false
    ],
    [
      `
      10     │    Disjoint
             │
             │
           ┌─┼─┐
      ─────┼─┼L┼─────
           └─┼─┘
             ├───┐
             │  R│
             ├───┘
    `,
      [-1, -1, 2, 2],
      [0, 2, 2, 2],
      false
    ],
    [
      `
      11     │    Disjoint
             │
             │
           ┌─┼─┐
      ─────┼─┼L┼┬───┬
           └─┼─┘│  R│
             │  └───┘
             │
             │
    `,
      [-1, -1, 2, 2],
      [2, 0, 2, 2],
      false
    ],
    ['0 Distant Disjoint', [0, 0, 10, 10], [17, -22, 8, 5], false],
    ['1 Distant Disjoint', [0, 0, 10, 10], [-17, -22, 8, 5], false],
    ['2 Distant Disjoint', [0, 0, 10, 10], [-17, 22, 8, 5], false],
    ['3 Distant Disjoint', [0, 0, 10, 10], [17, 22, 8, 5], false],
    ['0 Disparate Disjoint', [100, 100, 400, 1000], [20, -39, 12, 38], false],
    ['1 Disparate Disjoint', [100, 100, 400, 1000], [-20, -39, 12, 38], false],
    ['2 Disparate Disjoint', [100, 100, 400, 1000], [-20, 39, 12, 38], false],
    ['3 Disparate Disjoint', [100, 100, 400, 1000], [20, 39, 12, 38], false]
  ]

  for (const [diagram, l, r, hits] of cases) {
    const lBox = {x: l[0], y: l[1], w: l[2], h: l[3]}
    const rBox = {x: r[0], y: r[1], w: r[2], h: r[3]}
    ctx.test(`hits(l, r): ${diagram}`, () =>
      assert.equal(boxHits(lBox, rBox), hits)
    )
    ctx.test(`hits(r, l): ${diagram}`, () =>
      assert.equal(boxHits(rBox, lBox), hits)
    )
  }

  ctx.test("empty box doesn't hit nonempty box", () =>
    assert.equal(
      boxHits({x: 0.5, y: 0.5, w: 0, h: 0}, {x: 0, y: 0, w: 1, h: 1}),
      false
    )
  )

  ctx.test("nonempty box doesn't hit empty box", () =>
    assert.equal(
      boxHits({x: 0, y: 0, w: 1, h: 1}, {x: 0.5, y: 0.5, w: 0, h: 0}),
      false
    )
  )

  ctx.test('box hits point', () =>
    assert.equal(boxHits({x: 0, y: 0, w: 1, h: 1}, {x: 0.5, y: 0.5}), true)
  )

  ctx.test("flipped box doesn't hit nonempty box", () =>
    assert.equal(
      boxHits({x: 0.5, y: 0.5, w: -1, h: -1}, {x: 0, y: 0, w: 1, h: 1}),
      false
    )
  )
})

test('xyAdd()', () =>
  assert.deepEqual(xyAdd({x: 1, y: 2}, {x: 3, y: 4}), {x: 4, y: 6}))

test('xyAddTo()', () => {
  const xy = {x: 1, y: 2}
  xyAddTo(xy, {x: 3, y: 4})
  assert.deepEqual(xy, {x: 4, y: 6})
})

test('xyDistance()', () =>
  assert.deepEqual(xyDistance({x: 1, y: 2}, {x: 6, y: 14}), 13))

test('xyDiv()', () =>
  assert.deepEqual(xyDiv({x: 1, y: 2}, {x: 3, y: 4}), {x: 1 / 3, y: 2 / 4}))

test('xyEq()', () => {
  assert.deepEqual(xyEq({x: 1, y: 2}, {x: 1, y: 2}), true)
  assert.deepEqual(xyEq({x: 1, y: 2}, {x: 3, y: 4}), false)
})

test('xyMagnitude()', () => assert.deepEqual(xyMagnitude({x: 3, y: 4}), 5))

test('xyMax()', () =>
  assert.deepEqual(xyMax({x: 1, y: 2}, {x: 3, y: 4}), {x: 3, y: 4}))

test('xyMin()', () =>
  assert.deepEqual(xyMin({x: 1, y: 2}, {x: 3, y: 4}), {x: 1, y: 2}))

test('xySub()', () =>
  assert.deepEqual(xySub({x: 1, y: 2}, {x: 3, y: 4}), {x: -2, y: -2}))
