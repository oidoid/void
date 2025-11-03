import assert from 'node:assert/strict'
import {test} from 'node:test'
import {type Block, Pool} from './pool.ts'

test('alloc()', ctx => {
  const pool = new Pool({alloc: () => ({i: 0}), allocBytes: 5, pageBlocks: 2})

  ctx.test('has one page init', () => {
    assert.equal(pool.toDebugString(), '0000000000 0000000000')
  })

  ctx.test('fills one page', () => {
    pool.alloc()
    pool.alloc()
    assert.equal(pool.toDebugString(), '0000000000 0000000000')
  })

  ctx.test('grows to a second page', () => {
    pool.alloc()
    assert.equal(
      pool.toDebugString(),
      '0000000000 0000000000 0000000000 0000000000'
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

test('free()', ctx => {
  const pool = new Pool({alloc: () => ({i: 0}), allocBytes: 5, pageBlocks: 2})
  const blocks: Block[] = []

  ctx.test('underflows when nothing to free', () => {
    assert.throws(() => pool.free({i: 0}))
  })

  ctx.test('shrinks', () => {
    blocks.push(pool.alloc())
    assert.equal(pool.toDebugString(), '0000000000 0000000000')
    blocks.push(pool.alloc())
    blocks.push(pool.alloc())
    assert.equal(
      pool.toDebugString(),
      '0000000000 0000000000 0000000000 0000000000'
    )
    pool.free(blocks.shift()!)
    assert.equal(pool.toDebugString(), '0000000000 0000000000')
    pool.free(blocks.shift()!)
    assert.equal(pool.toDebugString(), '0000000000 0000000000')
  })

  ctx.test('never shrinks below one page', () => {
    for (const block of blocks) pool.free(block)
    blocks.length = 0
    assert.equal(pool.toDebugString(), '0000000000 0000000000')
  })
})

test('size', ctx => {
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

test('alloc to capacity then free middle and realloc', () => {
  const pool = new Pool({
    alloc: () => ({
      i: 0,
      get(): number {
        return pool.view.getUint8(this.i)
      },
      set(val: number): void {
        pool.view.setUint8(this.i, val)
      }
    }),
    allocBytes: 1,
    pageBlocks: 2
  })

  assert.equal(pool.toDebugString(), '00 00')

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
  assert.equal(pool.toDebugString(), '00 01 02 03 04 05')

  pool.free(blocks[2]!)
  assert.equal(blocks[5]!.i, 2)
  blocks.splice(2, 1)
  assert.deepEqual(
    blocks.map(block => block.get()),
    [0, 1, 3, 4, 5]
  )
  assert.equal(pool.toDebugString(), '00 01 05 03 04 05')

  pool.free(blocks[2]!)
  assert.equal(blocks[3]!.i, 3)
  blocks.splice(2, 1)
  assert.deepEqual(
    blocks.map(block => block.get()),
    [0, 1, 4, 5]
  )
  assert.equal(pool.toDebugString(), '00 01 05 04')

  pool.free(blocks[2]!)
  assert.equal(blocks[3]!.i, 2)
  blocks.splice(2, 1)
  assert.deepEqual(
    blocks.map(block => block.get()),
    [0, 1, 5]
  )
  assert.equal(pool.toDebugString(), '00 01 05 04')

  blocks.push(pool.alloc())
  assert.equal(blocks[3]!.i, 3)
  blocks[3]!.set(2)
  assert.deepEqual(
    blocks.map(block => block.get()),
    [0, 1, 5, 2]
  )
  assert.equal(pool.toDebugString(), '00 01 05 02')

  blocks.push(pool.alloc())
  assert.equal(blocks[4]!.i, 4)
  blocks[4]!.set(3)
  assert.deepEqual(
    blocks.map(block => block.get()),
    [0, 1, 5, 2, 3]
  )
  assert.equal(pool.toDebugString(), '00 01 05 02 03 00')

  blocks.push(pool.alloc())
  assert.equal(blocks[5]!.i, 5)
  blocks[5]!.set(4)
  assert.deepEqual(
    blocks.map(block => block.get()),
    [0, 1, 5, 2, 3, 4]
  )
  assert.equal(pool.toDebugString(), '00 01 05 02 03 04')
})
