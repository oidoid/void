import {describe, test} from 'node:test'
import {assert} from '../test/assert.ts'
import {type MaybeSID, type SID, Struct} from './struct.ts'
import type {StructPropSpec} from './struct-schema.ts'

test('alloc()', async ctx => {
  const struct = Struct({SID: 'sid'}, {pageSize: 2, pages: 1})

  await ctx.test('has one page init', () => {
    assert(struct.size, 0)
    assert(struct.capacity, 2)
    assertMem(struct, '00000000 00000000')
  })

  await ctx.test('fills one page', () => {
    const a = struct.alloc()
    const b = struct.alloc()
    assert(a, 1)
    assert(b, 2)
    assert(struct.size, 2)
    assertMem(struct, '01000000 02000000')
  })

  await ctx.test('grows to a second page', () => {
    const c = struct.alloc()
    assert(c, 3)
    assert(struct.size, 3)
    assert(struct.capacity, 4)
    assertMem(struct, '01000000 02000000 03000000 00000000')
  })
})

test('free()', async ctx => {
  const struct = Struct({V: 'u8', SID: 'sid'}, {pageSize: 2, pages: 1})

  await ctx.test('throws on unknown SID', () => {
    assert.throws(() => struct.free(99 as SID), /no struct/)
  })

  await ctx.test('compacts by moving last struct into freed slot', () => {
    const a = struct.alloc()
    const b = struct.alloc()
    const c = struct.alloc()
    struct.setV(a, 1)
    struct.setV(b, 2)
    struct.setV(c, 3)

    assert(struct.size, 3)
    assertMem(
      struct,
      '0100000001000000 0200000002000000 0300000003000000 0000000000000000'
    )

    struct.free(b)

    assert(struct.size, 2)
    assert(struct.getV(a), 1)
    assert(struct.getV(c), 3)
    assert.throws(() => struct.getV(b), /no struct/)

    // freed slot now contains C; last slot zeroed
    assertMem(
      struct,
      '0100000001000000 0300000003000000 0000000000000000 0000000000000000'
    )
  })

  await ctx.test('alloc after free gets new SID and zeroed slot', () => {
    const d = struct.alloc()
    assert(d, 4)
    assert(struct.getV(d), 0)
    assert(struct.toDebugString().includes('04000000'), true)
  })
})

test('clear()', async ctx => {
  const struct = Struct({V: 'u32', SID: 'sid'}, {pageSize: 2, pages: 1})

  await ctx.test('zeroes backing memory and resets counters', () => {
    const a = struct.alloc()
    const b = struct.alloc()
    struct.setV(a, 0xdeadbeef)
    struct.setV(b, 0xc001d00d)

    assert(struct.size, 2)
    assertMem(struct, 'efbeadde01000000 0dd001c002000000')

    struct.clear()

    assert(struct.size, 0)
    assert(struct.capacity, 2)
    assertMem(struct, '0000000000000000 0000000000000000')

    const c = struct.alloc()
    assert(c, 1)
    assertMem(struct, '0000000001000000 0000000000000000')
  })
})

test('grow()', () => {
  const struct = Struct({SID: 'sid'}, {pageSize: 2, pages: 1})

  assert(struct.capacity, 2)
  assertMem(struct, '00000000 00000000')

  struct.grow(2)
  assert(struct.capacity, 6)
  assertMem(struct, '00000000 00000000 00000000 00000000 00000000 00000000')
})

test('has()', () => {
  const struct = Struct({V: 'u8', SID: 'sid'}, {pageSize: 2, pages: 1})

  assert(struct.has(1 as SID), false)
  assertMem(struct, '0000000000000000 0000000000000000')

  const a = struct.alloc()
  assert(struct.has(a), true)
  assertMem(struct, '0000000001000000 0000000000000000')

  struct.free(a)
  assert(struct.has(a), false)
  assertMem(struct, '0000000000000000 0000000000000000')
})

test('iterator', () => {
  const struct = Struct({V: 'u8', SID: 'sid'}, {pageSize: 2, pages: 1})

  const a = struct.alloc()
  const b = struct.alloc()
  const c = struct.alloc()
  struct.setV(a, 1)
  struct.setV(b, 2)
  struct.setV(c, 3)

  assertMem(
    struct,
    '0100000001000000 0200000002000000 0300000003000000 0000000000000000'
  )

  struct.free(b)
  assert(struct.has(b), false)
  assertMem(
    struct,
    '0100000001000000 0300000003000000 0000000000000000 0000000000000000'
  )

  const got = [...struct]
  assert(got.includes(a), true)
  assert(got.includes(b), false)
  assert(got.includes(c), true)
})

describe('F16 packing', () => {
  test('rounds up to next byte', () => {
    const struct = Struct(
      {X: 'bool', Y: 'bool', A: 'f16', SID: 'sid'},
      {pageSize: 2, pages: 1}
    )
    const sid = struct.alloc()

    struct.setX(sid, true)
    struct.setY(sid, true)
    struct.setA(sid, 1.25)
    assert(struct.getX(sid), true)
    assert(struct.getY(sid), true)
    assert(struct.getA(sid), 1.25)
    assertMem(struct, '03003d0001000000 0000000000000000')
  })

  test('uses existing byte offset', () => {
    const struct = Struct(
      {X: 'u8', A: 'f16', SID: 'sid'},
      {pageSize: 2, pages: 1}
    )
    const sid = struct.alloc()

    struct.setX(sid, 0xaa)
    struct.setA(sid, 1.25)
    assert(struct.getX(sid), 0xaa)
    assert(struct.getA(sid), 1.25)
    assertMem(struct, 'aa003d0001000000 0000000000000000')
  })

  test('does not straddle words', () => {
    const struct = Struct(
      {X: 'u24', A: 'f16', SID: 'sid'},
      {pageSize: 2, pages: 1}
    )
    const sid = struct.alloc()

    struct.setX(sid, 0x00c0de)
    struct.setA(sid, 1.25)
    assert(struct.getX(sid), 0x00c0de)
    assert(struct.getA(sid), 1.25)
    assertMem(struct, 'dec00000003d000001000000 000000000000000000000000')
  })
})

test('rollover / truncation', async ctx => {
  type Step = {name: string; get: number; set: number; mem: string}
  type Case = {
    name: string
    schema: {A: StructPropSpec; SID: 'sid'}
    steps: Step[]
  }

  const cases: Case[] = [
    {
      name: 'u8',
      schema: {A: 'u8', SID: 'sid'},
      steps: [
        {name: 'min', get: 0, set: 0, mem: '0000000001000000'},
        {name: 'max', get: 255, set: 255, mem: 'ff00000001000000'},
        {name: '+1 rollover', get: 0, set: 256, mem: '0000000001000000'},
        {name: '-1 rollover', get: 255, set: -1, mem: 'ff00000001000000'},
        {name: 'fraction trunc', get: 1, set: 1.9, mem: '0100000001000000'}
      ]
    },
    {
      name: 'f16',
      schema: {A: 'f16', SID: 'sid'},
      steps: [
        {name: 'default 0', get: 0, set: 0, mem: '0000000001000000'},
        {name: 'fractional', get: 1.25, set: 1.25, mem: '003d000001000000'},
        {name: 'negative', get: -3.5, set: -3.5, mem: '00c3000001000000'},
        {name: 'max finite', get: 65504, set: 65504, mem: 'ff7b000001000000'},
        {
          name: 'overflow to infinity',
          get: Number.POSITIVE_INFINITY,
          set: 70000,
          mem: '007c000001000000'
        },
        {
          name: '-overflow to -infinity',
          get: Number.NEGATIVE_INFINITY,
          set: -70000,
          mem: '00fc000001000000'
        },
        {
          name: 'min subnormal',
          get: 2 ** -24,
          set: 2 ** -24,
          mem: '0100000001000000'
        },
        {
          name: 'subnormal underflow rounds to 0',
          get: 0,
          set: 2 ** -25,
          mem: '0000000001000000'
        },
        {
          name: 'Infinity',
          get: Number.POSITIVE_INFINITY,
          set: Number.POSITIVE_INFINITY,
          mem: '007c000001000000'
        },
        {
          name: '-Infinity',
          get: Number.NEGATIVE_INFINITY,
          set: Number.NEGATIVE_INFINITY,
          mem: '00fc000001000000'
        }
      ]
    },
    {
      name: 'i8',
      schema: {A: 'i8', SID: 'sid'},
      steps: [
        {name: 'max', get: 127, set: 127, mem: '7f00000001000000'},
        {name: 'min', get: -128, set: -128, mem: '8000000001000000'},
        {name: '+1 rollover', get: -128, set: 128, mem: '8000000001000000'},
        {name: '255 -> -1', get: -1, set: 255, mem: 'ff00000001000000'},
        {name: 'fraction trunc', get: -1, set: -1.9, mem: 'ff00000001000000'}
      ]
    },
    {
      name: 'u16',
      schema: {A: 'u16', SID: 'sid'},
      steps: [
        {name: 'min', get: 0, set: 0, mem: '0000000001000000'},
        {name: 'max', get: 0xffff, set: 0xffff, mem: 'ffff000001000000'},
        {name: '+1 rollover', get: 0, set: 0x1_0000, mem: '0000000001000000'},
        {name: '-1 rollover', get: 0xffff, set: -1, mem: 'ffff000001000000'},
        {name: 'fraction trunc', get: 2, set: 2.9, mem: '0200000001000000'}
      ]
    },
    {
      name: 'i16',
      schema: {A: 'i16', SID: 'sid'},
      steps: [
        {name: 'max', get: 32767, set: 32767, mem: 'ff7f000001000000'},
        {name: 'min', get: -32768, set: -32768, mem: '0080000001000000'},
        {name: '+1 rollover', get: -32768, set: 32768, mem: '0080000001000000'},
        {name: '65535 -> -1', get: -1, set: 65535, mem: 'ffff000001000000'},
        {name: 'fraction trunc', get: 1, set: 1.9, mem: '0100000001000000'}
      ]
    },
    {
      name: 'u32',
      schema: {A: 'u32', SID: 'sid'},
      steps: [
        {name: 'min', get: 0, set: 0, mem: '0000000001000000'},
        {
          name: 'max',
          get: 0xffffffff,
          set: 0xffffffff,
          mem: 'ffffffff01000000'
        },
        {
          name: '-1 rollover',
          get: 0xffffffff,
          set: -1,
          mem: 'ffffffff01000000'
        },
        {name: 'fraction trunc', get: 2, set: 2.9, mem: '0200000001000000'}
      ]
    },
    {
      name: 'i32',
      schema: {A: 'i32', SID: 'sid'},
      steps: [
        {
          name: 'max',
          get: 2147483647,
          set: 2147483647,
          mem: 'ffffff7f01000000'
        },
        {
          name: 'min',
          get: -2147483648,
          set: -2147483648,
          mem: '0000008001000000'
        },
        {
          name: '+1 rollover',
          get: -2147483648,
          set: 2147483648,
          mem: '0000008001000000'
        },
        {
          name: '4294967295 -> -1',
          get: -1,
          set: 4294967295,
          mem: 'ffffffff01000000'
        },
        {name: 'fraction trunc', get: -1, set: -1.9, mem: 'ffffffff01000000'}
      ]
    },
    {
      name: 'u4',
      schema: {A: 'u4', SID: 'sid'},
      steps: [
        {name: 'min', get: 0, set: 0, mem: '0000000001000000'},
        {name: 'max', get: 15, set: 15, mem: '0f00000001000000'},
        {name: '+1 rollover', get: 0, set: 16, mem: '0000000001000000'},
        {name: '-1 rollover', get: 15, set: -1, mem: '0f00000001000000'},
        {name: 'fraction trunc', get: 1, set: 1.9, mem: '0100000001000000'}
      ]
    },
    {
      name: 'i4',
      schema: {A: 'i4', SID: 'sid'},
      steps: [
        {name: 'max', get: 7, set: 7, mem: '0700000001000000'},
        {name: 'min', get: -8, set: -8, mem: '0800000001000000'},
        {name: '+1 rollover', get: -8, set: 8, mem: '0800000001000000'},
        {name: '15 -> -1', get: -1, set: 15, mem: '0f00000001000000'},
        {name: 'fraction trunc', get: -1, set: -1.9, mem: '0f00000001000000'}
      ]
    },
    {
      name: 'u12',
      schema: {A: 'u12', SID: 'sid'},
      steps: [
        {name: 'min', get: 0, set: 0, mem: '0000000001000000'},
        {name: 'max', get: 0xfff, set: 0xfff, mem: 'ff0f000001000000'},
        {name: '+1 rollover', get: 0, set: 0x1000, mem: '0000000001000000'},
        {name: '-1 rollover', get: 0xfff, set: -1, mem: 'ff0f000001000000'},
        {name: 'fraction trunc', get: 2, set: 2.9, mem: '0200000001000000'}
      ]
    },
    {
      name: 'i12',
      schema: {A: 'i12', SID: 'sid'},
      steps: [
        {name: 'max', get: 2047, set: 2047, mem: 'ff07000001000000'},
        {name: 'min', get: -2048, set: -2048, mem: '0008000001000000'},
        {name: '+1 rollover', get: -2048, set: 2048, mem: '0008000001000000'},
        {name: '4095 -> -1', get: -1, set: 4095, mem: 'ff0f000001000000'},
        {name: 'fraction trunc', get: -1, set: -1.9, mem: 'ff0f000001000000'}
      ]
    },
    {
      name: 'scaled sub-word (U12/10)',
      schema: {A: 'u12/10', SID: 'sid'},
      steps: [
        {name: 'min', get: 0, set: 0, mem: '0000000001000000'},
        {name: 'max', get: 409.5, set: 409.5, mem: 'ff0f000001000000'},
        {name: '+0.01 trunc', get: 1.2, set: 1.239, mem: '0c00000001000000'},
        {name: '+1 rollover', get: 0, set: 409.6, mem: '0000000001000000'}
      ]
    },
    {
      name: 'scaled sub-word (I12/100)',
      schema: {A: 'i12/100', SID: 'sid'},
      steps: [
        {name: 'max', get: 20.47, set: 20.47, mem: 'ff07000001000000'},
        {name: 'min', get: -20.48, set: -20.48, mem: '0008000001000000'},
        {
          name: 'fraction trunc',
          get: 1.23,
          set: 1.239,
          mem: '7b00000001000000'
        },
        {name: '+1 rollover', get: -20.48, set: 20.48, mem: '0008000001000000'}
      ]
    },
    {
      name: 'f32',
      schema: {A: 'f32', SID: 'sid'},
      steps: [
        {name: 'default 0', get: 0, set: 0, mem: '0000000001000000'},
        {name: 'fractional', get: 1.25, set: 1.25, mem: '0000a03f01000000'},
        {name: 'negative', get: -3.5, set: -3.5, mem: '000060c001000000'},
        {
          name: 'Infinity',
          get: Number.POSITIVE_INFINITY,
          set: Number.POSITIVE_INFINITY,
          mem: '0000807f01000000'
        },
        {
          name: '-Infinity',
          get: Number.NEGATIVE_INFINITY,
          set: Number.NEGATIVE_INFINITY,
          mem: '000080ff01000000'
        }
      ]
    },
    {
      name: 'f64',
      schema: {A: 'f64', SID: 'sid'},
      steps: [
        {name: 'default 0', get: 0, set: 0, mem: '000000000000000001000000'},
        {
          name: 'fractional',
          get: 1 / 3,
          set: 1 / 3,
          mem: '555555555555d53f01000000'
        },
        {
          name: 'negative',
          get: -11.5,
          set: -11.5,
          mem: '00000000000027c001000000'
        },
        {
          name: 'Infinity',
          get: Number.POSITIVE_INFINITY,
          set: Number.POSITIVE_INFINITY,
          mem: '000000000000f07f01000000'
        },
        {
          name: '-Infinity',
          get: Number.NEGATIVE_INFINITY,
          set: Number.NEGATIVE_INFINITY,
          mem: '000000000000f0ff01000000'
        }
      ]
    },
    {
      name: 'NaN (F16)',
      schema: {A: 'f16', SID: 'sid'},
      steps: [
        {
          name: 'NaN roundtrip',
          get: Number.NaN,
          set: Number.NaN,
          mem: '007e000001000000'
        }
      ]
    },
    {
      name: 'NaN (F32)',
      schema: {A: 'f32', SID: 'sid'},
      steps: [
        {
          name: 'NaN roundtrip',
          get: Number.NaN,
          set: Number.NaN,
          mem: '0000c07f01000000'
        }
      ]
    },
    {
      name: 'NaN (F64)',
      schema: {A: 'f64', SID: 'sid'},
      steps: [
        {
          name: 'NaN roundtrip',
          get: Number.NaN,
          set: Number.NaN,
          mem: '000000000000f87f01000000'
        }
      ]
    },
    {
      name: 'scaled fixed-point (U8/10)',
      schema: {A: 'u8/10', SID: 'sid'},
      steps: [
        {name: 'min', get: 0, set: 0, mem: '0000000001000000'},
        {name: 'max', get: 25.5, set: 25.5, mem: 'ff00000001000000'},
        {name: 'fraction trunc', get: 12.5, set: 12.56, mem: '7d00000001000000'}
      ]
    },
    {
      name: 'scaled fixed-point (I16/100)',
      schema: {A: 'i16/100', SID: 'sid'},
      steps: [
        {name: 'max', get: 327.67, set: 327.67, mem: 'ff7f000001000000'},
        {name: 'min', get: -327.68, set: -327.68, mem: '0080000001000000'},
        {name: 'fraction trunc', get: 1.23, set: 1.239, mem: '7b00000001000000'}
      ]
    },
    {
      name: 'scaled fixed-point (U32/1000)',
      schema: {A: 'u32/1000', SID: 'sid'},
      steps: [
        {name: 'min', get: 0, set: 0, mem: '0000000001000000'},
        {
          name: 'fraction trunc',
          get: 1.239,
          set: 1.2399,
          mem: 'd704000001000000'
        },
        {
          name: 'max',
          get: 4294967.295,
          set: 4294967.295,
          mem: 'ffffffff01000000'
        }
      ]
    }
  ]

  for (const {name, schema, steps} of cases) {
    await ctx.test(name, () => {
      const struct = Struct(schema, {pageSize: 1, pages: 1})
      const sid = struct.alloc()
      for (const {get, set, mem} of steps) {
        struct.setA(sid, set)
        assert(struct.getA(sid), get)
        assertMem(struct, mem)
      }
    })
  }
})

test('fields do not interfere (write 1..N through packed schema)', () => {
  const struct = Struct(
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
      L: 'f64',
      Name: 'str',
      Obj: 'obj',
      SID: 'sid'
    },
    {pageSize: 1, pages: 1}
  )

  const sid = struct.alloc()
  const obj = {ok: true}

  struct.setA(sid, 1)
  struct.setB(sid, 2)
  struct.setC(sid, 3)
  struct.setD(sid, 4)
  struct.setE(sid, -5)
  struct.setF(sid, 6)
  struct.setG(sid, -7)
  struct.setH(sid, 8)
  struct.setI(sid, -9)
  struct.setJ(sid, 10.25)
  struct.setK(sid, 11.25)
  struct.setL(sid, -12.5)
  struct.setName(sid, 'x')
  struct.setObj(sid, obj)

  assert(struct.getA(sid), 1)
  assert(struct.getB(sid), 2)
  assert(struct.getC(sid), 3)
  assert(struct.getD(sid), 4)
  assert(struct.getE(sid), -5)
  assert(struct.getF(sid), 6)
  assert(struct.getG(sid), -7)
  assert(struct.getH(sid), 8)
  assert(struct.getI(sid), -9)
  assert(struct.getJ(sid), 10.25)
  assert(struct.getK(sid), 11.25)
  assert(struct.getL(sid), -12.5)
  assert(struct.getName(sid), 'x')
  assert(struct.getObj(sid), obj)
})

test('SIDs as a singly linked list', async ctx => {
  const struct = Struct(
    {Next: 'sid', Value: 'u16', SID: 'sid'},
    {
      pageSize: 2,
      pages: 1
    }
  )

  await ctx.test('build list and traverse', () => {
    const a = struct.alloc()
    const b = struct.alloc()
    const c = struct.alloc()

    struct.setValue(a, 10)
    struct.setValue(b, 20)
    struct.setValue(c, 30)

    struct.setNext(a, b)
    struct.setNext(b, c)
    struct.setNext(c, 0)

    assert(struct.getNext(a), b)
    assert(struct.getNext(b), c)
    assert(struct.getNext(c), 0)

    const out: number[] = []
    let sid: MaybeSID = a
    while (sid) {
      out.push(struct.getValue(sid))
      sid = struct.getNext(sid)
    }
    assert(out, [10, 20, 30])
  })

  await ctx.test('remove middle node by relinking', () => {
    const [a, b, c] = [...struct] as [SID, SID, SID]

    assert(struct.getNext(a), b)
    struct.setNext(a, c)

    const out: number[] = []
    let sid: MaybeSID = a
    while (sid) {
      out.push(struct.getValue(sid))
      sid = struct.getNext(sid)
    }
    assert(out, [10, 30])
  })

  await ctx.test('free node and ensure list traversal still works', () => {
    const [head, middle] = [...struct] as [SID, SID]
    struct.free(middle)

    const out: number[] = []
    let sid: MaybeSID = head
    while (sid) {
      out.push(struct.getValue(sid))
      sid = struct.getNext(sid)
    }
    assert(out.length >= 1, true)
  })
})

function assertMem(struct: Struct<unknown>, expected: string): void {
  assert(struct.toDebugString(), expected)
}
