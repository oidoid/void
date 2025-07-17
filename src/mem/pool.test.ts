import { assertEquals, assertThrows } from '@std/assert'
import { type Block, Pool } from './pool.ts'
import { assertInlineSnapshot } from '@std/testing/unstable-snapshot'

Deno.test('alloc()', async (test) => {
  const pool = new Pool({
    alloc: () => ({i: 0}),
    allocBytes: 5,
    pageBlocks: 2,
    maxPages: 3
  })

  await test.step('has one page init', () => {
    assertInlineSnapshot(
      pool.toDebugString(),
      `"000000000000000000 000000000000000000"`
    )
  })

  await test.step('fills one page', () => {
    pool.alloc()
    pool.alloc()
    assertInlineSnapshot(
      pool.toDebugString(),
      `"000000000000000000 000000000001000000"`
    )
  })

  await test.step('grows to a second page', () => {
    pool.alloc()
    assertInlineSnapshot(
      pool.toDebugString(),
      `"000000000000000000 000000000001000000 000000000002000000 000000000000000000"`
    )
  })

  await test.step('overflows when at capacity', () => {
    for (let i = 0; i < 3; i++) pool.alloc()
    assertThrows(() => pool.alloc())
  })
})

Deno.test('capacity', async (test) => {
  await test.step('is zero when no pages or blocks', () => {
    const pool = new Pool({
      alloc: () => ({i: 0}),
      allocBytes: 0,
      pageBlocks: 0,
      maxPages: 0
    })
    assertEquals(pool.capacity, 0)
  })

  await test.step('is blocks * pages', () => {
    const pool = new Pool({
      alloc: () => ({i: 0}),
      allocBytes: 5,
      pageBlocks: 2,
      maxPages: 3
    })
    assertEquals(pool.capacity, 6)
  })
})

Deno.test('clear() sets pool to init state', () => {
  const pool = new Pool({
    alloc: () => ({i: 0}),
    allocBytes: 5,
    pageBlocks: 2,
    maxPages: 3
  })

  const alloc = []
  for (let i = 0; i < 6; i++) alloc.push(pool.alloc().i)

  pool.clear()

  const realloc = []
  for (let i = 0; i < 6; i++) realloc.push(pool.alloc().i)

  assertEquals(alloc, realloc)
})

Deno.test('constructor() limits capacity', () => {
  assertThrows(() =>
    new Pool({
      alloc: () => ({i: 0}),
      allocBytes: 1,
      pageBlocks: 0x1_0000_0000,
      maxPages: 1
    })
  )
})

Deno.test('free()', async (test) => {
  const pool = new Pool({
    alloc: () => ({i: 0}),
    allocBytes: 5,
    pageBlocks: 2,
    maxPages: 3
  })
  const blocks: Block[] = []

  await test.step('underflows when nothing to free', () => {
    assertThrows(() => pool.free({i: 0}))
  })

  await test.step('downsizes pages when in excess of two blocks', () => {
    blocks.push(pool.alloc())
    assertInlineSnapshot(
      pool.toDebugString(),
      `"000000000000000000 000000000000000000"`
    )
    blocks.push(pool.alloc())
    blocks.push(pool.alloc())
    assertInlineSnapshot(
      pool.toDebugString(),
      `"000000000000000000 000000000001000000 000000000002000000 000000000000000000"`
    )
    pool.free(blocks.shift()!)
    assertInlineSnapshot(
      pool.toDebugString(),
      `"000000000002000000 000000000001000000 000000000002000000 000000000000000000"`
    )
    pool.free(blocks.shift()!)
    assertInlineSnapshot(
      pool.toDebugString(),
      `"000000000002000000 000000000001000000"`
    )
  })

  await test.step('keeps at least one page', () => {
    while (blocks.length) pool.free(blocks.shift()!)
    assertInlineSnapshot(
      pool.toDebugString(),
      `"000000000002000000 000000000001000000"`
    )
  })
})

Deno.test('size', async (test) => {
  const pool = new Pool({
    alloc: () => ({i: 0}),
    allocBytes: 5,
    pageBlocks: 2,
    maxPages: 3
  })

  await test.step('is zero init', () => assertEquals(pool.size, 0))

  await test.step('is one after an alloc', () => {
    pool.alloc()
    assertEquals(pool.size, 1)
  })

  await test.step('is two after an alloc', () => {
    pool.alloc()
    assertEquals(pool.size, 2)
  })
})

Deno.test('stride', async (test) => {
  await test.step('is at least handle sized', () =>
    assertEquals(
      new Pool({
        alloc: () => ({i: 0}),
        allocBytes: 0,
        pageBlocks: 2,
        maxPages: 3
      }).stride,
      4
    ))

  await test.step('is alloc + handle', () =>
    assertEquals(
      new Pool({
        alloc: () => ({i: 0}),
        allocBytes: 1,
        pageBlocks: 2,
        maxPages: 3
      }).stride,
      5
    ))
})

Deno.test('alloc to capacity then free middle and realloc', () => {
  const pool = new Pool({
    alloc: () => ({
      i: 0,
      get(): number {
        return pool.view.getUint8(this.i * pool.stride)
      },
      set(val: number): void {
        pool.view.setUint8(this.i * pool.stride, val)
      }
    }),
    allocBytes: 1,
    pageBlocks: 2,
    maxPages: 3
  })

  assertInlineSnapshot(pool.toDebugString(), `"0000000000 0000000000"`)

  const blocks = []
  for (let i = 0; i < 6; i++) {
    const block = pool.alloc()
    block.set(i)
    blocks.push(block)
  }

  assertEquals(blocks.map((block) => block.get()), [0, 1, 2, 3, 4, 5])
  assertInlineSnapshot(
    pool.toDebugString(),
    `"0000000000 0101000000 0202000000 0303000000 0404000000 0505000000"`
  )

  pool.free(blocks[2]!)
  assertEquals(blocks[2]!.i, 6)
  assertEquals(blocks[5]!.i, 2)
  blocks.splice(2, 1)
  assertEquals(blocks.map((block) => block.get()), [0, 1, 3, 4, 5])
  assertInlineSnapshot(
    pool.toDebugString(),
    `"0000000000 0101000000 0505000000 0303000000 0404000000 0505000000"`
  )

  pool.free(blocks[2]!)
  assertEquals(blocks[2]!.i, 2)
  assertEquals(blocks[3]!.i, 3)
  blocks.splice(2, 1)
  assertEquals(blocks.map((block) => block.get()), [0, 1, 4, 5])
  assertInlineSnapshot(
    pool.toDebugString(),
    `"0000000000 0101000000 0505000000 0404000000 0404000000 0505000000"`
  )

  pool.free(blocks[2]!)
  assertEquals(blocks[2]!.i, 3)
  assertEquals(blocks[3]!.i, 2)
  blocks.splice(2, 1)
  assertEquals(blocks.map((block) => block.get()), [0, 1, 5])
  assertInlineSnapshot(
    pool.toDebugString(),
    `"0000000000 0101000000 0505000000 0404000000"`
  )

  blocks.push(pool.alloc())
  assertEquals(blocks[3]!.i, 3)
  blocks[3]!.set(2)
  assertEquals(blocks.map((block) => block.get()), [0, 1, 5, 2])
  assertInlineSnapshot(
    pool.toDebugString(),
    `"0000000000 0101000000 0505000000 0204000000"`
  )

  blocks.push(pool.alloc())
  assertEquals(blocks[4]!.i, 4)
  blocks[4]!.set(3)
  assertEquals(blocks.map((block) => block.get()), [0, 1, 5, 2, 3])
  assertInlineSnapshot(
    pool.toDebugString(),
    `"0000000000 0101000000 0505000000 0204000000 0303000000 0000000000"`
  )

  blocks.push(pool.alloc())
  assertEquals(blocks[5]!.i, 5)
  blocks[5]!.set(4)
  assertEquals(blocks.map((block) => block.get()), [0, 1, 5, 2, 3, 4])
  assertInlineSnapshot(
    pool.toDebugString(),
    `"0000000000 0101000000 0505000000 0204000000 0303000000 0402000000"`
  )
})
