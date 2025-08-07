import assert from 'node:assert/strict'
import {test} from 'node:test'
import {type Block, Pool} from './pool.ts'

test('alloc()', async ctx => {
  const pool = new Pool({alloc: () => ({i: 0}), allocBytes: 5, pageBlocks: 2})

  ctx.test('has one page init', () => {
    assert.equal(pool.toDebugString(), '000000000000000000 000000000000000000')
  })

  ctx.test('fills one page', () => {
    pool.alloc()
    pool.alloc()
    assert.equal(pool.toDebugString(), '000000000000000000 000000000001000000')
  })

  ctx.test('grows to a second page', () => {
    pool.alloc()
    assert.equal(
      pool.toDebugString(),
      '000000000000000000 000000000001000000 000000000002000000 000000000000000000'
    )
  })
})

test('clear() sets pool to init state', () => {
  const pool = new Pool({alloc: () => ({i: 0}), allocBytes: 5, pageBlocks: 2})

  const alloc = []
  for (let i = 0; i < 6; i++) alloc.push(pool.alloc().i)

  pool.clear()

  const realloc = []
  for (let i = 0; i < 6; i++) realloc.push(pool.alloc().i)

  assert.deepEqual(alloc, realloc)
})

test('constructor() limits capacity', () => {
  assert.throws(
    () =>
      new Pool({
        alloc: () => ({i: 0}),
        allocBytes: 1,
        pageBlocks: 0x1_0000_0000
      })
  )
})

test('free()', async ctx => {
  const pool = new Pool({alloc: () => ({i: 0}), allocBytes: 5, pageBlocks: 2})
  const blocks: Block[] = []

  ctx.test('underflows when nothing to free', () => {
    assert.throws(() => pool.free({i: 0}))
  })

  ctx.test("doesn't shrink", () => {
    blocks.push(pool.alloc())
    assert.equal(pool.toDebugString(), '000000000000000000 000000000000000000')
    blocks.push(pool.alloc())
    blocks.push(pool.alloc())
    assert.equal(
      pool.toDebugString(),
      '000000000000000000 000000000001000000 000000000002000000 000000000000000000'
    )
    pool.free(blocks.shift()!)
    assert.equal(
      pool.toDebugString(),
      '000000000002000000 000000000001000000 000000000002000000 000000000000000000'
    )
    pool.free(blocks.shift()!)
    assert.equal(
      pool.toDebugString(),
      '000000000002000000 000000000001000000 000000000002000000 000000000000000000'
    )
  })

  ctx.test('never shrinks', () => {
    while (blocks.length) pool.free(blocks.shift()!)
    assert.equal(
      pool.toDebugString(),
      '000000000002000000 000000000001000000 000000000002000000 000000000000000000'
    )
  })
})

test('size', async ctx => {
  const pool = new Pool({alloc: () => ({i: 0}), allocBytes: 5, pageBlocks: 2})

  ctx.test('is zero init', () => assert.equal(pool.size, 0))

  ctx.test('is one after an alloc', () => {
    pool.alloc()
    assert.equal(pool.size, 1)
  })

  ctx.test('is two after an alloc', () => {
    pool.alloc()
    assert.equal(pool.size, 2)
  })
})

test('stride', async ctx => {
  ctx.test('is at least handle sized', () =>
    assert.equal(
      new Pool({alloc: () => ({i: 0}), allocBytes: 0, pageBlocks: 2}).stride,
      4
    )
  )

  ctx.test('is alloc + handle', () =>
    assert.equal(
      new Pool({alloc: () => ({i: 0}), allocBytes: 1, pageBlocks: 2}).stride,
      5
    )
  )
})

test('alloc to capacity then free middle and realloc', () => {
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
    pageBlocks: 2
  })

  assert.equal(pool.toDebugString(), '0000000000 0000000000')

  const blocks = []
  for (let i = 0; i < 6; i++) {
    const block = pool.alloc()
    block.set(i)
    blocks.push(block)
  }

  assert.deepEqual(
    blocks.map(block => block.get()),
    [0, 1, 2, 3, 4, 5]
  )
  assert.equal(
    pool.toDebugString(),
    '0000000000 0101000000 0202000000 0303000000 0404000000 0505000000'
  )

  pool.free(blocks[2]!)
  assert.equal(blocks[2]!.i, 6)
  assert.equal(blocks[5]!.i, 2)
  blocks.splice(2, 1)
  assert.deepEqual(
    blocks.map(block => block.get()),
    [0, 1, 3, 4, 5]
  )
  assert.equal(
    pool.toDebugString(),
    '0000000000 0101000000 0505000000 0303000000 0404000000 0505000000'
  )

  pool.free(blocks[2]!)
  assert.equal(blocks[2]!.i, 2)
  assert.equal(blocks[3]!.i, 3)
  blocks.splice(2, 1)
  assert.deepEqual(
    blocks.map(block => block.get()),
    [0, 1, 4, 5]
  )
  assert.equal(
    pool.toDebugString(),
    '0000000000 0101000000 0505000000 0404000000 0404000000 0505000000'
  )

  pool.free(blocks[2]!)
  assert.equal(blocks[2]!.i, 3)
  assert.equal(blocks[3]!.i, 2)
  blocks.splice(2, 1)
  assert.deepEqual(
    blocks.map(block => block.get()),
    [0, 1, 5]
  )
  assert.equal(
    pool.toDebugString(),
    '0000000000 0101000000 0505000000 0404000000 0404000000 0505000000'
  )

  blocks.push(pool.alloc())
  assert.equal(blocks[3]!.i, 3)
  blocks[3]!.set(2)
  assert.deepEqual(
    blocks.map(block => block.get()),
    [0, 1, 5, 2]
  )
  assert.equal(
    pool.toDebugString(),
    '0000000000 0101000000 0505000000 0204000000 0404000000 0505000000'
  )

  blocks.push(pool.alloc())
  assert.equal(blocks[4]!.i, 4)
  blocks[4]!.set(3)
  assert.deepEqual(
    blocks.map(block => block.get()),
    [0, 1, 5, 2, 3]
  )
  assert.equal(
    pool.toDebugString(),
    '0000000000 0101000000 0505000000 0204000000 0303000000 0505000000'
  )

  blocks.push(pool.alloc())
  assert.equal(blocks[5]!.i, 5)
  blocks[5]!.set(4)
  assert.deepEqual(
    blocks.map(block => block.get()),
    [0, 1, 5, 2, 3, 4]
  )
  assert.equal(
    pool.toDebugString(),
    '0000000000 0101000000 0505000000 0204000000 0303000000 0402000000'
  )
})
