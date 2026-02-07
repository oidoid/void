import {describe, test} from 'node:test'
import {assert} from '../test/assert.ts'
import {StructArray} from './struct.ts'
import type {StructPropSpec, StructSchema} from './struct-schema.ts'

test('alloc()', async ctx => {
  const struct = new StructArray(
    {V: 'u32'},
    {
      alloc: () => ({cursor: 0}),
      pageSize: 2,
      pages: 1
    }
  )

  await ctx.test('has one page init', () => {
    assert(struct.size, 0)
    assert(struct.capacity, 2)
    assertMem(struct, '00000000 00000000')
  })

  await ctx.test('fills one page', () => {
    const a = struct.alloc()
    const b = struct.alloc()
    assert(a.cursor, 0)
    assert(b.cursor, 4)
    assert(struct.size, 2)
    assertMem(struct, '00000000 00000000')
  })

  await ctx.test('grows to a second page', () => {
    const c = struct.alloc()
    assert(c.cursor, 8)
    assert(struct.size, 3)
    assert(struct.capacity, 4)
    assertMem(struct, '00000000 00000000 00000000 00000000')
  })
})

test('free()', async ctx => {
  const struct = new StructArray(
    {V: 'u8'},
    {
      alloc: () => ({cursor: 0}),
      pageSize: 2,
      pages: 1
    }
  )

  await ctx.test('throws on underflow', () => {
    assert.throws(() => struct.free({cursor: 0}), /underflow/)
  })

  await ctx.test('compacts by moving last struct into freed slot', () => {
    const a = struct.alloc()
    const b = struct.alloc()
    const c = struct.alloc()
    a.setV(1)
    b.setV(2)
    c.setV(3)

    assert(struct.size, 3)
    assertMem(struct, '01000000 02000000 03000000 00000000')

    struct.free(b)

    assert(struct.size, 2)
    assert(a.getV(), 1)
    // b's slot now has c's data.
    assert(b.getV(), 3)

    // freed slot now contains C; last slot zeroed.
    assertMem(struct, '01000000 03000000 00000000 00000000')
  })

  await ctx.test('alloc after free reuses zeroed slot', () => {
    const d = struct.alloc()
    assert(d.getV(), 0)
  })
})

test('clear()', async ctx => {
  const struct = new StructArray(
    {V: 'u32'},
    {
      alloc: () => ({cursor: 0}),
      pageSize: 2,
      pages: 1
    }
  )

  await ctx.test('zeroes backing memory and resets counters', () => {
    const a = struct.alloc()
    const b = struct.alloc()
    a.setV(0xdeadbeef)
    b.setV(0xc001d00d)

    assert(struct.size, 2)
    assertMem(struct, 'efbeadde 0dd001c0')

    struct.clear()

    assert(struct.size, 0)
    assert(struct.capacity, 2)
    assertMem(struct, '00000000 00000000')

    const c = struct.alloc()
    assert(c.getV(), 0)
    assertMem(struct, '00000000 00000000')
  })
})

test('grow()', () => {
  const struct = new StructArray(
    {V: 'u8'},
    {
      alloc: () => ({cursor: 0}),
      pageSize: 2,
      pages: 1
    }
  )

  assert(struct.capacity, 2)
  assertMem(struct, '00000000 00000000')

  struct.grow(2)
  assert(struct.capacity, 6)
  assertMem(struct, '00000000 00000000 00000000 00000000 00000000 00000000')
})

test('iterator', () => {
  const struct = new StructArray(
    {V: 'u8'},
    {
      alloc: () => ({cursor: 0}),
      pageSize: 2,
      pages: 1
    }
  )

  const a = struct.alloc()
  const b = struct.alloc()
  const c = struct.alloc()
  a.setV(1)
  b.setV(2)
  c.setV(3)

  assertMem(struct, '01000000 02000000 03000000 00000000')

  struct.free(b)
  assertMem(struct, '01000000 03000000 00000000 00000000')

  const got = [...struct]
  assert(got.length, 2)
  assert(got[0]!.getV(), 1)
  assert(got[1]!.getV(), 3)
})

describe('F16 packing', () => {
  test('rounds up to next byte', () => {
    const struct = new StructArray(
      {X: 'bool', Y: 'bool', A: 'f16'},
      {
        alloc: () => ({cursor: 0}),
        pageSize: 2,
        pages: 1
      }
    )
    const block = struct.alloc()

    block.setX(true)
    block.setY(true)
    block.setA(1.25)
    assert(block.isX(), true)
    assert(block.isY(), true)
    assert(block.getA(), 1.25)
    assertMem(struct, '03003d00 00000000')
  })

  test('uses existing byte offset', () => {
    const struct = new StructArray(
      {X: 'u8', A: 'f16'},
      {
        alloc: () => ({cursor: 0}),
        pageSize: 2,
        pages: 1
      }
    )
    const block = struct.alloc()

    block.setX(0xaa)
    block.setA(1.25)
    assert(block.getX(), 0xaa)
    assert(block.getA(), 1.25)
    assertMem(struct, 'aa003d00 00000000')
  })

  test('does not straddle words', () => {
    const struct = new StructArray(
      {X: 'u24', A: 'f16'},
      {
        alloc: () => ({cursor: 0}),
        pageSize: 2,
        pages: 1
      }
    )
    const block = struct.alloc()

    block.setX(0x00c0de)
    block.setA(1.25)
    assert(block.getX(), 0x00c0de)
    assert(block.getA(), 1.25)
    assertMem(struct, 'dec00000003d0000 0000000000000000')
  })
})

test('accessor roundtrip', async ctx => {
  type Case = {
    name: string
    schema: StructSchema
    set: string
    get: string
    v: unknown
    expect: unknown
    mem: string
  }
  const cases: Case[] = [
    {
      name: 'bool default false',
      schema: {X: 'bool'},
      set: 'setX',
      get: 'isX',
      v: false,
      expect: false,
      mem: '00000000'
    },
    {
      name: 'bool true',
      schema: {X: 'bool'},
      set: 'setX',
      get: 'isX',
      v: true,
      expect: true,
      mem: '01000000'
    },
    {
      name: 'bool false',
      schema: {X: 'bool'},
      set: 'setX',
      get: 'isX',
      v: false,
      expect: false,
      mem: '00000000'
    }
  ]
  for (const {name, schema, set, get, v: value, expect, mem} of cases) {
    await ctx.test(name, () => {
      const struct = new StructArray(schema, {
        alloc: () => ({cursor: 0}),
        pageSize: 1,
        pages: 1
      })
      const block = struct.alloc()

      const setFn = (block as Record<string, unknown>)[set] as (
        v: unknown
      ) => void
      const getFn = (block as Record<string, unknown>)[get] as () => unknown

      setFn.call(block, value)
      assert(getFn.call(block), expect)
      assertMem(struct, mem)
    })
  }
})

test('rollover / truncation', async ctx => {
  type Case = {
    name: string
    spec: StructPropSpec
    get: number
    set: number
    mem: string
  }

  const cases: Case[] = [
    {name: 'u8 min', spec: 'u8', get: 0, set: 0, mem: '00000000'},
    {name: 'u8 max', spec: 'u8', get: 255, set: 255, mem: 'ff000000'},
    {
      name: 'u8 +1 rollover',
      spec: 'u8',
      get: 0,
      set: 256,
      mem: '00000000'
    },
    {
      name: 'u8 -1 rollover',
      spec: 'u8',
      get: 255,
      set: -1,
      mem: 'ff000000'
    },
    {
      name: 'u8 fraction trunc',
      spec: 'u8',
      get: 1,
      set: 1.9,
      mem: '01000000'
    },
    {
      name: 'u8 trunc toward zero (1.1 -> 1)',
      spec: 'u8',
      get: 1,
      set: 1.1,
      mem: '01000000'
    },
    {
      name: 'u8 trunc toward zero (-1.1 -> 255)',
      spec: 'u8',
      get: 255,
      set: -1.1,
      mem: 'ff000000'
    },
    {
      name: 'u8 max-1',
      spec: 'u8',
      get: 254,
      set: 254,
      mem: 'fe000000'
    },
    {
      name: 'u8 max+2 rollover (257 -> 1)',
      spec: 'u8',
      get: 1,
      set: 257,
      mem: '01000000'
    },

    {
      name: 'f16 default 0',
      spec: 'f16',
      get: 0,
      set: 0,
      mem: '00000000'
    },
    {
      name: 'f16 fractional',
      spec: 'f16',
      get: 1.25,
      set: 1.25,
      mem: '003d0000'
    },
    {
      name: 'f16 negative',
      spec: 'f16',
      get: -3.5,
      set: -3.5,
      mem: '00c30000'
    },
    {
      name: 'f16 max finite',
      spec: 'f16',
      get: 65504,
      set: 65504,
      mem: 'ff7b0000'
    },
    {
      name: 'f16 overflow to infinity',
      spec: 'f16',
      get: Number.POSITIVE_INFINITY,
      set: 70000,
      mem: '007c0000'
    },
    {
      name: 'f16 -overflow to -infinity',
      spec: 'f16',
      get: Number.NEGATIVE_INFINITY,
      set: -70000,
      mem: '00fc0000'
    },
    {
      name: 'f16 min subnormal',
      spec: 'f16',
      get: 2 ** -24,
      set: 2 ** -24,
      mem: '01000000'
    },
    {
      name: 'f16 subnormal underflow rounds to 0',
      spec: 'f16',
      get: 0,
      set: 2 ** -25,
      mem: '00000000'
    },
    {
      name: 'f16 Infinity',
      spec: 'f16',
      get: Number.POSITIVE_INFINITY,
      set: Number.POSITIVE_INFINITY,
      mem: '007c0000'
    },
    {
      name: 'f16 -Infinity',
      spec: 'f16',
      get: Number.NEGATIVE_INFINITY,
      set: Number.NEGATIVE_INFINITY,
      mem: '00fc0000'
    },

    {name: 'i8 max', spec: 'i8', get: 127, set: 127, mem: '7f000000'},
    {name: 'i8 min', spec: 'i8', get: -128, set: -128, mem: '80000000'},
    {
      name: 'i8 +1 rollover',
      spec: 'i8',
      get: -128,
      set: 128,
      mem: '80000000'
    },
    {
      name: 'i8 255 -> -1',
      spec: 'i8',
      get: -1,
      set: 255,
      mem: 'ff000000'
    },
    {
      name: 'i8 fraction trunc',
      spec: 'i8',
      get: -1,
      set: -1.9,
      mem: 'ff000000'
    },
    {
      name: 'i8 trunc toward zero (1.9 -> 1)',
      spec: 'i8',
      get: 1,
      set: 1.9,
      mem: '01000000'
    },
    {
      name: 'i8 trunc toward zero (-1.1 -> -1)',
      spec: 'i8',
      get: -1,
      set: -1.1,
      mem: 'ff000000'
    },
    {
      name: 'i8 max-1',
      spec: 'i8',
      get: 126,
      set: 126,
      mem: '7e000000'
    },
    {
      name: 'i8 min+1',
      spec: 'i8',
      get: -127,
      set: -127,
      mem: '81000000'
    },
    {
      name: 'i8 129 -> -127',
      spec: 'i8',
      get: -127,
      set: 129,
      mem: '81000000'
    },

    {name: 'u16 min', spec: 'u16', get: 0, set: 0, mem: '00000000'},
    {
      name: 'u16 max',
      spec: 'u16',
      get: 0xffff,
      set: 0xffff,
      mem: 'ffff0000'
    },
    {
      name: 'u16 +1 rollover',
      spec: 'u16',
      get: 0,
      set: 0x1_0000,
      mem: '00000000'
    },
    {
      name: 'u16 -1 rollover',
      spec: 'u16',
      get: 0xffff,
      set: -1,
      mem: 'ffff0000'
    },
    {
      name: 'u16 fraction trunc',
      spec: 'u16',
      get: 2,
      set: 2.9,
      mem: '02000000'
    },
    {
      name: 'u16 trunc toward zero (2.1 -> 2)',
      spec: 'u16',
      get: 2,
      set: 2.1,
      mem: '02000000'
    },
    {
      name: 'u16 trunc toward zero (-1.1 -> 65535)',
      spec: 'u16',
      get: 0xffff,
      set: -1.1,
      mem: 'ffff0000'
    },
    {
      name: 'u16 max-1',
      spec: 'u16',
      get: 0xfffe,
      set: 0xfffe,
      mem: 'feff0000'
    },
    {
      name: 'u16 max+2 rollover (65537 -> 1)',
      spec: 'u16',
      get: 1,
      set: 0x1_0001,
      mem: '01000000'
    },

    {
      name: 'i16 max',
      spec: 'i16',
      get: 32767,
      set: 32767,
      mem: 'ff7f0000'
    },
    {
      name: 'i16 min',
      spec: 'i16',
      get: -32768,
      set: -32768,
      mem: '00800000'
    },
    {
      name: 'i16 +1 rollover',
      spec: 'i16',
      get: -32768,
      set: 32768,
      mem: '00800000'
    },
    {
      name: 'i16 65535 -> -1',
      spec: 'i16',
      get: -1,
      set: 65535,
      mem: 'ffff0000'
    },
    {
      name: 'i16 fraction trunc',
      spec: 'i16',
      get: 1,
      set: 1.9,
      mem: '01000000'
    },
    {
      name: 'i16 trunc toward zero (-1.9 -> -1)',
      spec: 'i16',
      get: -1,
      set: -1.9,
      mem: 'ffff0000'
    },
    {
      name: 'i16 max-1',
      spec: 'i16',
      get: 32766,
      set: 32766,
      mem: 'fe7f0000'
    },
    {
      name: 'i16 min+1',
      spec: 'i16',
      get: -32767,
      set: -32767,
      mem: '01800000'
    },
    {
      name: 'i16 32769 -> -32767',
      spec: 'i16',
      get: -32767,
      set: 32769,
      mem: '01800000'
    },

    {name: 'u32 min', spec: 'u32', get: 0, set: 0, mem: '00000000'},
    {
      name: 'u32 max',
      spec: 'u32',
      get: 0xffffffff,
      set: 0xffffffff,
      mem: 'ffffffff'
    },
    {
      name: 'u32 -1 rollover',
      spec: 'u32',
      get: 0xffffffff,
      set: -1,
      mem: 'ffffffff'
    },
    {
      name: 'u32 fraction trunc',
      spec: 'u32',
      get: 2,
      set: 2.9,
      mem: '02000000'
    },
    {
      name: 'u32 trunc toward zero (2.1 -> 2)',
      spec: 'u32',
      get: 2,
      set: 2.1,
      mem: '02000000'
    },
    {
      name: 'u32 trunc toward zero (-1.1 -> 0xffffffff)',
      spec: 'u32',
      get: 0xffffffff,
      set: -1.1,
      mem: 'ffffffff'
    },
    {
      name: 'u32 max-1',
      spec: 'u32',
      get: 0xfffffffe,
      set: 0xfffffffe,
      mem: 'feffffff'
    },
    {
      name: 'u32 max+2 rollover (0x1_0000_0001 -> 1)',
      spec: 'u32',
      get: 1,
      set: 0x1_0000_0001,
      mem: '01000000'
    },

    {
      name: 'i32 max',
      spec: 'i32',
      get: 2147483647,
      set: 2147483647,
      mem: 'ffffff7f'
    },
    {
      name: 'i32 min',
      spec: 'i32',
      get: -2147483648,
      set: -2147483648,
      mem: '00000080'
    },
    {
      name: 'i32 +1 rollover',
      spec: 'i32',
      get: -2147483648,
      set: 2147483648,
      mem: '00000080'
    },
    {
      name: 'i32 4294967295 -> -1',
      spec: 'i32',
      get: -1,
      set: 4294967295,
      mem: 'ffffffff'
    },
    {
      name: 'i32 fraction trunc',
      spec: 'i32',
      get: -1,
      set: -1.9,
      mem: 'ffffffff'
    },
    {
      name: 'i32 trunc toward zero (1.9 -> 1)',
      spec: 'i32',
      get: 1,
      set: 1.9,
      mem: '01000000'
    },
    {
      name: 'i32 max-1',
      spec: 'i32',
      get: 2147483646,
      set: 2147483646,
      mem: 'feffff7f'
    },
    {
      name: 'i32 min+1',
      spec: 'i32',
      get: -2147483647,
      set: -2147483647,
      mem: '01000080'
    },
    {
      name: 'i32 2147483649 -> -2147483647',
      spec: 'i32',
      get: -2147483647,
      set: 2147483649,
      mem: '01000080'
    },

    {name: 'u4 min', spec: 'u4', get: 0, set: 0, mem: '00000000'},
    {name: 'u4 max', spec: 'u4', get: 15, set: 15, mem: '0f000000'},
    {
      name: 'u4 +1 rollover',
      spec: 'u4',
      get: 0,
      set: 16,
      mem: '00000000'
    },
    {
      name: 'u4 -1 rollover',
      spec: 'u4',
      get: 15,
      set: -1,
      mem: '0f000000'
    },
    {
      name: 'u4 fraction trunc',
      spec: 'u4',
      get: 1,
      set: 1.9,
      mem: '01000000'
    },
    {
      name: 'u4 trunc toward zero (-1.1 -> 15)',
      spec: 'u4',
      get: 15,
      set: -1.1,
      mem: '0f000000'
    },
    {
      name: 'u4 max-1',
      spec: 'u4',
      get: 14,
      set: 14,
      mem: '0e000000'
    },
    {
      name: 'u4 max+2 rollover (17 -> 1)',
      spec: 'u4',
      get: 1,
      set: 17,
      mem: '01000000'
    },

    {name: 'i4 max', spec: 'i4', get: 7, set: 7, mem: '07000000'},
    {name: 'i4 min', spec: 'i4', get: -8, set: -8, mem: '08000000'},
    {
      name: 'i4 +1 rollover',
      spec: 'i4',
      get: -8,
      set: 8,
      mem: '08000000'
    },
    {
      name: 'i4 15 -> -1',
      spec: 'i4',
      get: -1,
      set: 15,
      mem: '0f000000'
    },
    {
      name: 'i4 fraction trunc',
      spec: 'i4',
      get: -1,
      set: -1.9,
      mem: '0f000000'
    },
    {
      name: 'i4 trunc toward zero (1.9 -> 1)',
      spec: 'i4',
      get: 1,
      set: 1.9,
      mem: '01000000'
    },
    {
      name: 'i4 max-1',
      spec: 'i4',
      get: 6,
      set: 6,
      mem: '06000000'
    },
    {
      name: 'i4 min+1',
      spec: 'i4',
      get: -7,
      set: -7,
      mem: '09000000'
    },
    {
      name: 'i4 9 -> -7',
      spec: 'i4',
      get: -7,
      set: 9,
      mem: '09000000'
    },

    {name: 'u12 min', spec: 'u12', get: 0, set: 0, mem: '00000000'},
    {
      name: 'u12 max',
      spec: 'u12',
      get: 0xfff,
      set: 0xfff,
      mem: 'ff0f0000'
    },
    {
      name: 'u12 +1 rollover',
      spec: 'u12',
      get: 0,
      set: 0x1000,
      mem: '00000000'
    },
    {
      name: 'u12 -1 rollover',
      spec: 'u12',
      get: 0xfff,
      set: -1,
      mem: 'ff0f0000'
    },
    {
      name: 'u12 fraction trunc',
      spec: 'u12',
      get: 2,
      set: 2.9,
      mem: '02000000'
    },
    {
      name: 'u12 trunc toward zero (-1.1 -> 4095)',
      spec: 'u12',
      get: 0xfff,
      set: -1.1,
      mem: 'ff0f0000'
    },
    {
      name: 'u12 max-1',
      spec: 'u12',
      get: 0xffe,
      set: 0xffe,
      mem: 'fe0f0000'
    },
    {
      name: 'u12 max+2 rollover (4097 -> 1)',
      spec: 'u12',
      get: 1,
      set: 0x1001,
      mem: '01000000'
    },

    {
      name: 'i12 max',
      spec: 'i12',
      get: 2047,
      set: 2047,
      mem: 'ff070000'
    },
    {
      name: 'i12 min',
      spec: 'i12',
      get: -2048,
      set: -2048,
      mem: '00080000'
    },
    {
      name: 'i12 +1 rollover',
      spec: 'i12',
      get: -2048,
      set: 2048,
      mem: '00080000'
    },
    {
      name: 'i12 4095 -> -1',
      spec: 'i12',
      get: -1,
      set: 4095,
      mem: 'ff0f0000'
    },
    {
      name: 'i12 fraction trunc',
      spec: 'i12',
      get: -1,
      set: -1.9,
      mem: 'ff0f0000'
    },
    {
      name: 'i12 trunc toward zero (1.9 -> 1)',
      spec: 'i12',
      get: 1,
      set: 1.9,
      mem: '01000000'
    },
    {
      name: 'i12 max-1',
      spec: 'i12',
      get: 2046,
      set: 2046,
      mem: 'fe070000'
    },
    {
      name: 'i12 min+1',
      spec: 'i12',
      get: -2047,
      set: -2047,
      mem: '01080000'
    },
    {
      name: 'i12 2049 -> -2047',
      spec: 'i12',
      get: -2047,
      set: 2049,
      mem: '01080000'
    },

    {
      name: 'scaled sub-word (U12/10) min',
      spec: 'u12/10',
      get: 0,
      set: 0,
      mem: '00000000'
    },
    {
      name: 'scaled sub-word (U12/10) max',
      spec: 'u12/10',
      get: 409.5,
      set: 409.5,
      mem: 'ff0f0000'
    },
    {
      name: 'scaled sub-word (U12/10) +0.01 trunc',
      spec: 'u12/10',
      get: 1.2,
      set: 1.239,
      mem: '0c000000'
    },
    {
      name: 'scaled sub-word (U12/10) +1 rollover',
      spec: 'u12/10',
      get: 0,
      set: 409.6,
      mem: '00000000'
    },

    {
      name: 'scaled sub-word (I12/100) max',
      spec: 'i12/100',
      get: 20.47,
      set: 20.47,
      mem: 'ff070000'
    },
    {
      name: 'scaled sub-word (I12/100) min',
      spec: 'i12/100',
      get: -20.48,
      set: -20.48,
      mem: '00080000'
    },
    {
      name: 'scaled sub-word (I12/100) fraction trunc',
      spec: 'i12/100',
      get: 1.23,
      set: 1.239,
      mem: '7b000000'
    },
    {
      name: 'scaled sub-word (I12/100) +1 rollover',
      spec: 'i12/100',
      get: -20.48,
      set: 20.48,
      mem: '00080000'
    },

    {
      name: 'f32 default 0',
      spec: 'f32',
      get: 0,
      set: 0,
      mem: '00000000'
    },
    {
      name: 'f32 fractional',
      spec: 'f32',
      get: 1.25,
      set: 1.25,
      mem: '0000a03f'
    },
    {
      name: 'f32 negative',
      spec: 'f32',
      get: -3.5,
      set: -3.5,
      mem: '000060c0'
    },
    {
      name: 'f32 Infinity',
      spec: 'f32',
      get: Number.POSITIVE_INFINITY,
      set: Number.POSITIVE_INFINITY,
      mem: '0000807f'
    },
    {
      name: 'f32 -Infinity',
      spec: 'f32',
      get: Number.NEGATIVE_INFINITY,
      set: Number.NEGATIVE_INFINITY,
      mem: '000080ff'
    },

    {
      name: 'f64 default 0',
      spec: 'f64',
      get: 0,
      set: 0,
      mem: '0000000000000000'
    },
    {
      name: 'f64 fractional',
      spec: 'f64',
      get: 1 / 3,
      set: 1 / 3,
      mem: '555555555555d53f'
    },
    {
      name: 'f64 negative',
      spec: 'f64',
      get: -11.5,
      set: -11.5,
      mem: '00000000000027c0'
    },
    {
      name: 'f64 Infinity',
      spec: 'f64',
      get: Number.POSITIVE_INFINITY,
      set: Number.POSITIVE_INFINITY,
      mem: '000000000000f07f'
    },
    {
      name: 'f64 -Infinity',
      spec: 'f64',
      get: Number.NEGATIVE_INFINITY,
      set: Number.NEGATIVE_INFINITY,
      mem: '000000000000f0ff'
    },

    {
      name: 'NaN (F16) NaN roundtrip',
      spec: 'f16',
      get: Number.NaN,
      set: Number.NaN,
      mem: '007e0000'
    },
    {
      name: 'NaN (F32) NaN roundtrip',
      spec: 'f32',
      get: Number.NaN,
      set: Number.NaN,
      mem: '0000c07f'
    },
    {
      name: 'NaN (F64) NaN roundtrip',
      spec: 'f64',
      get: Number.NaN,
      set: Number.NaN,
      mem: '000000000000f87f'
    },

    {
      name: 'scaled fixed-point (U8/10) min',
      spec: 'u8/10',
      get: 0,
      set: 0,
      mem: '00000000'
    },
    {
      name: 'scaled fixed-point (U8/10) max',
      spec: 'u8/10',
      get: 25.5,
      set: 25.5,
      mem: 'ff000000'
    },
    {
      name: 'scaled fixed-point (U8/10) fraction trunc',
      spec: 'u8/10',
      get: 12.5,
      set: 12.56,
      mem: '7d000000'
    },

    {
      name: 'scaled fixed-point (I16/100) max',
      spec: 'i16/100',
      get: 327.67,
      set: 327.67,
      mem: 'ff7f0000'
    },
    {
      name: 'scaled fixed-point (I16/100) min',
      spec: 'i16/100',
      get: -327.68,
      set: -327.68,
      mem: '00800000'
    },
    {
      name: 'scaled fixed-point (I16/100) fraction trunc',
      spec: 'i16/100',
      get: 1.23,
      set: 1.239,
      mem: '7b000000'
    },

    {
      name: 'scaled fixed-point (U32/1000) min',
      spec: 'u32/1000',
      get: 0,
      set: 0,
      mem: '00000000'
    },
    {
      name: 'scaled fixed-point (U32/1000) fraction trunc',
      spec: 'u32/1000',
      get: 1.239,
      set: 1.2399,
      mem: 'd7040000'
    },
    {
      name: 'scaled fixed-point (U32/1000) max',
      spec: 'u32/1000',
      get: 4294967.295,
      set: 4294967.295,
      mem: 'ffffffff'
    }
  ]

  for (const {name, spec, get, set, mem} of cases) {
    await ctx.test(name, () => {
      const struct = new StructArray(
        {A: spec},
        {
          alloc: () => ({cursor: 0}),
          pageSize: 1,
          pages: 1
        }
      )
      const block = struct.alloc() as {
        setA(v: number): void
        getA(): number
        cursor: number
      }
      block.setA(set)
      assert(block.getA(), get)
      assertMem(struct, mem)
    })
  }
})

test('fields do not interfere (write 1..N through packed schema)', () => {
  const struct = new StructArray(
    {
      A: 'u4',
      B: 'u4',
      C: 'u8',
      D: 'u12',
      E: 'i12',
      F: 'u16',
      G: 'i16',
      H: 'u32',
      I: 'i32',
      J: 'f16',
      K: 'f32',
      L: 'f64'
    },
    {alloc: () => ({cursor: 0}), pageSize: 1, pages: 1}
  )

  const block = struct.alloc()

  block.setA(1)
  block.setB(2)
  block.setC(3)
  block.setD(4)
  block.setE(-5)
  block.setF(6)
  block.setG(-7)
  block.setH(8)
  block.setI(-9)
  block.setJ(10.25)
  block.setK(11.25)
  block.setL(-12.5)

  assert(block.getA(), 1)
  assert(block.getB(), 2)
  assert(block.getC(), 3)
  assert(block.getD(), 4)
  assert(block.getE(), -5)
  assert(block.getF(), 6)
  assert(block.getG(), -7)
  assert(block.getH(), 8)
  assert(block.getI(), -9)
  assert(block.getJ(), 10.25)
  assert(block.getK(), 11.25)
  assert(block.getL(), -12.5)
})

function assertMem(struct: {toDebugString(): string}, expected: string): void {
  assert(
    struct.toDebugString().replaceAll(' ', ''),
    expected.replaceAll(' ', '')
  )
}
