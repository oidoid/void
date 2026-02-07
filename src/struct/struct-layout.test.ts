import test, {describe} from 'node:test'
import {assert} from '../test/assert.ts'
import {StructLayout, StructPropLayout} from './struct-layout.ts'
import type {StructSchema} from './struct-schema.ts'

describe('StructLayout()', () => {
  for (const {name, input, expected} of [
    {
      name: 'empty struct',
      input: {} satisfies StructSchema,
      expected: {
        props: [],
        size: 0
      } satisfies StructLayout
    },
    {
      name: 'packs bools densely within a word',
      input: {
        A: 'bool',
        B: 'bool',
        C: 'bool'
      } satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'A',
            type: 'Bool',
            offset: 0,
            bit: 0,
            signed: false,
            scale: 1,
            w: 1
          },
          {
            name: 'B',
            type: 'Bool',
            offset: 0,
            bit: 1,
            signed: false,
            scale: 1,
            w: 1
          },
          {
            name: 'C',
            type: 'Bool',
            offset: 0,
            bit: 2,
            signed: false,
            scale: 1,
            w: 1
          }
        ],
        size: 4
      } satisfies StructLayout
    },
    {
      name: 'does not straddle word boundary',
      input: {A: 'u31', B: 'u2'} satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'A',
            type: 'Int',
            offset: 0,
            bit: 0,
            signed: false,
            w: 31,
            scale: 1
          },
          {
            name: 'B',
            type: 'Int',
            offset: 4,
            bit: 0,
            signed: false,
            w: 2,
            scale: 1
          }
        ],
        size: 8
      } satisfies StructLayout
    },
    {
      name: 'allows exact end-of-word packing',
      input: {A: 'u31', B: 'bool'} satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'A',
            type: 'Int',
            offset: 0,
            bit: 0,
            signed: false,
            w: 31,
            scale: 1
          },
          {
            name: 'B',
            type: 'Bool',
            offset: 0,
            bit: 31,
            signed: false,
            scale: 1,
            w: 1
          }
        ],
        size: 4
      } satisfies StructLayout
    },
    {
      name: 'u32 occupies a full word',
      input: {A: 'u32', B: 'u1'} satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'A',
            type: 'Int',
            offset: 0,
            bit: 0,
            signed: false,
            w: 32,
            scale: 1
          },
          {
            name: 'B',
            type: 'Int',
            offset: 4,
            bit: 0,
            signed: false,
            w: 1,
            scale: 1
          }
        ],
        size: 8
      } satisfies StructLayout
    },
    {
      name: 'F32 occupies a full word aligned to word boundaries',
      input: {A: 'u1', B: 'f32'} satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'A',
            type: 'Int',
            offset: 0,
            bit: 0,
            signed: false,
            w: 1,
            scale: 1
          },
          {
            name: 'B',
            type: 'Float',
            offset: 4,
            bit: 0,
            signed: false,
            scale: 1,
            w: 32
          }
        ],
        size: 8
      } satisfies StructLayout
    },
    {
      name: 'F16 is byte-aligned and can pack with another f16 within the same word',
      input: {A: 'f16', B: 'f16'} satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'A',
            type: 'Float',
            offset: 0,
            bit: 0,
            signed: false,
            scale: 1,
            w: 16
          },
          {
            name: 'B',
            type: 'Float',
            offset: 2,
            bit: 16,
            signed: false,
            scale: 1,
            w: 16
          }
        ],
        size: 4
      } satisfies StructLayout
    },
    {
      name: 'F16 follows byte alignment: after a U8 it starts at the next byte boundary',
      input: {A: 'u8', B: 'f16'} satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'A',
            type: 'Byte',
            offset: 0,
            bit: 0,
            signed: false,
            scale: 1,
            w: 8
          },
          {
            name: 'B',
            type: 'Float',
            offset: 1,
            bit: 8,
            signed: false,
            scale: 1,
            w: 16
          }
        ],
        size: 4
      } satisfies StructLayout
    },
    {
      name: 'F16 rounds up to next byte after a Bool when it fits in the current word',
      input: {A: 'bool', B: 'f16'} satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'A',
            type: 'Bool',
            offset: 0,
            bit: 0,
            signed: false,
            scale: 1,
            w: 1
          },
          {
            name: 'B',
            type: 'Float',
            offset: 1,
            bit: 8,
            signed: false,
            scale: 1,
            w: 16
          }
        ],
        size: 4
      } satisfies StructLayout
    },
    {
      name: 'F16 does not straddle word boundary',
      input: {A: 'u24', B: 'f16'} satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'A',
            type: 'Int',
            offset: 0,
            bit: 0,
            signed: false,
            w: 24,
            scale: 1
          },
          {
            name: 'B',
            type: 'Float',
            offset: 4,
            bit: 0,
            signed: false,
            scale: 1,
            w: 16
          }
        ],
        size: 8
      } satisfies StructLayout
    },
    {
      name: 'F64 aligns to word boundary and occupies 8 bytes',
      input: {A: 'u1', B: 'f64', C: 'u1'} satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'A',
            type: 'Int',
            offset: 0,
            bit: 0,
            signed: false,
            w: 1,
            scale: 1
          },
          {
            name: 'B',
            type: 'Float',
            offset: 4,
            bit: 0,
            signed: false,
            w: 64,
            scale: 1
          },
          {
            name: 'C',
            type: 'Int',
            offset: 12,
            bit: 0,
            signed: false,
            w: 1,
            scale: 1
          }
        ],
        size: 16
      } satisfies StructLayout
    },
    {
      name: 'Byte and Short layouts on byte boundaries',
      input: {A: 'u8', B: 'u16', C: 'u8'} satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'A',
            type: 'Byte',
            offset: 0,
            bit: 0,
            signed: false,
            scale: 1,
            w: 8
          },
          {
            name: 'B',
            type: 'Short',
            offset: 1,
            bit: 8,
            signed: false,
            scale: 1,
            w: 16
          },
          {
            name: 'C',
            type: 'Byte',
            offset: 3,
            bit: 24,
            signed: false,
            scale: 1,
            w: 8
          }
        ],
        size: 4
      } satisfies StructLayout
    },
    {
      name: 'Byte then Int: Int uses the containing word offset (0)',
      input: {A: 'u8', B: 'u1'} satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'A',
            type: 'Byte',
            offset: 0,
            bit: 0,
            signed: false,
            scale: 1,
            w: 8
          },
          {
            name: 'B',
            type: 'Int',
            offset: 0,
            bit: 8,
            signed: false,
            scale: 1,
            w: 1
          }
        ],
        size: 4
      } satisfies StructLayout
    },
    {
      name: 'Byte then Short: Short can start at byte offset 1',
      input: {A: 'u8', B: 'u16'} satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'A',
            type: 'Byte',
            offset: 0,
            bit: 0,
            signed: false,
            scale: 1,
            w: 8
          },
          {
            name: 'B',
            type: 'Short',
            offset: 1,
            bit: 8,
            signed: false,
            scale: 1,
            w: 16
          }
        ],
        size: 4
      } satisfies StructLayout
    },
    {
      name: '32 bools fill the word exactly; the next bool starts next word',
      input: Object.fromEntries(
        [...Array(33)].map((_, i) => [`B${i}`, 'bool'])
      ) as StructSchema,
      expected: {
        props: [
          ...[...Array(32)].map(
            (_, i) =>
              ({
                name: `B${i}`,
                type: 'Bool',
                offset: 0,
                bit: i,
                signed: false,
                scale: 1,
                w: 1
              }) as const
          ),
          {
            name: 'B32',
            type: 'Bool',
            offset: 4,
            bit: 0,
            signed: false,
            scale: 1,
            w: 1
          }
        ],
        size: 8
      } satisfies StructLayout
    },
    {
      name: 'scaled ints keep scale and pack as normal',
      input: {
        A: 'i8/2',
        B: 'u8/3',
        C: 'u16/10'
      } satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'A',
            type: 'Byte',
            offset: 0,
            bit: 0,
            signed: true,
            scale: 2,
            w: 8
          },
          {
            name: 'B',
            type: 'Byte',
            offset: 1,
            bit: 8,
            signed: false,
            scale: 3,
            w: 8
          },
          {
            name: 'C',
            type: 'Short',
            offset: 2,
            bit: 16,
            signed: false,
            scale: 10,
            w: 16
          }
        ],
        size: 4
      } satisfies StructLayout
    },
    {
      name: 'mixed packing and size rounding',
      input: {A: 'u31', B: 'u1', C: 'f32'} satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'A',
            type: 'Int',
            offset: 0,
            bit: 0,
            signed: false,
            w: 31,
            scale: 1
          },
          {
            name: 'B',
            type: 'Int',
            offset: 0,
            bit: 31,
            signed: false,
            w: 1,
            scale: 1
          },
          {
            name: 'C',
            type: 'Float',
            offset: 4,
            bit: 0,
            signed: false,
            scale: 1,
            w: 32
          }
        ],
        size: 8
      } satisfies StructLayout
    },
    {
      name: 'mixed packing and size rounding (F16)',
      input: {A: 'u31', B: 'u1', C: 'f16'} satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'A',
            type: 'Int',
            offset: 0,
            bit: 0,
            signed: false,
            w: 31,
            scale: 1
          },
          {
            name: 'B',
            type: 'Int',
            offset: 0,
            bit: 31,
            signed: false,
            w: 1,
            scale: 1
          },
          {
            name: 'C',
            type: 'Float',
            offset: 4,
            bit: 0,
            signed: false,
            scale: 1,
            w: 16
          }
        ],
        size: 8
      } satisfies StructLayout
    }
  ] as const)
    test(name, () => assert(StructLayout(input), expected))

  test('sprite struct', () => {
    assert(
      StructLayout({
        X: 'i24/64',
        Zend: 'bool',
        Z: 'u4',
        // 3b unused.
        Y: 'i24/64',
        // 8b unused.
        Hidden: 'bool',
        Stretch: 'bool',
        FlipX: 'bool',
        FlipY: 'bool',
        W: 'u12',
        H: 'u12',
        // 4b unused
        Anim: 'u11',
        Cel: 'u5',
        Angle: 'u12'
        // 4b unused.
      }),
      {
        props: [
          {
            name: 'X',
            type: 'Int',
            offset: 0,
            bit: 0,
            signed: true,
            w: 24,
            scale: 64
          },
          {
            name: 'Zend',
            type: 'Bool',
            offset: 0,
            bit: 24,
            signed: false,
            scale: 1,
            w: 1
          },
          {
            name: 'Z',
            type: 'Int',
            offset: 0,
            bit: 25,
            signed: false,
            w: 4,
            scale: 1
          },
          {
            name: 'Y',
            type: 'Int',
            offset: 4,
            bit: 0,
            signed: true,
            w: 24,
            scale: 64
          },
          {
            name: 'Hidden',
            type: 'Bool',
            offset: 4,
            bit: 24,
            signed: false,
            scale: 1,
            w: 1
          },
          {
            name: 'Stretch',
            type: 'Bool',
            offset: 4,
            bit: 25,
            signed: false,
            scale: 1,
            w: 1
          },
          {
            name: 'FlipX',
            type: 'Bool',
            offset: 4,
            bit: 26,
            signed: false,
            scale: 1,
            w: 1
          },
          {
            name: 'FlipY',
            type: 'Bool',
            offset: 4,
            bit: 27,
            signed: false,
            scale: 1,
            w: 1
          },
          {
            name: 'W',
            type: 'Int',
            offset: 8,
            bit: 0,
            signed: false,
            w: 12,
            scale: 1
          },
          {
            name: 'H',
            type: 'Int',
            offset: 8,
            bit: 12,
            signed: false,
            w: 12,
            scale: 1
          },
          {
            name: 'Anim',
            type: 'Int',
            offset: 12,
            bit: 0,
            signed: false,
            w: 11,
            scale: 1
          },
          {
            name: 'Cel',
            type: 'Int',
            offset: 12,
            bit: 11,
            signed: false,
            w: 5,
            scale: 1
          },
          {
            name: 'Angle',
            type: 'Int',
            offset: 12,
            bit: 16,
            signed: false,
            w: 12,
            scale: 1
          }
        ],
        size: 16
      }
    )
  })
})

describe('StructPropLayout()', () => {
  test('u8 at bit 0 is Byte', () => {
    assert(StructPropLayout('x', 'u8', 0, 0), {
      name: 'x',
      type: 'Byte',
      offset: 0,
      bit: 0,
      signed: false,
      scale: 1,
      w: 8
    })
  })

  test('u16 at bit 8 is Short', () => {
    assert(StructPropLayout('x', 'u16', 0, 8), {
      name: 'x',
      type: 'Short',
      offset: 1,
      bit: 8,
      signed: false,
      scale: 1,
      w: 16
    })
  })

  test('u16 at bit 1 stays Int', () => {
    assert(StructPropLayout('x', 'u16', 0, 1), {
      name: 'x',
      type: 'Int',
      offset: 0,
      bit: 1,
      signed: false,
      scale: 1,
      w: 16
    })
  })

  test('bool at bit 32 bumps to next word', () => {
    assert(StructPropLayout('x', 'bool', 0, 32), {
      name: 'x',
      type: 'Bool',
      offset: 4,
      bit: 0,
      signed: false,
      scale: 1,
      w: 1
    })
  })

  test('u8 at bit 1 stays Int', () => {
    assert(StructPropLayout('x', 'u8', 0, 1), {
      name: 'x',
      type: 'Int',
      offset: 0,
      bit: 1,
      signed: false,
      scale: 1,
      w: 8
    })
  })

  test('u16 at bit 16 is Short at offset 2', () => {
    assert(StructPropLayout('x', 'u16', 0, 16), {
      name: 'x',
      type: 'Short',
      offset: 2,
      bit: 16,
      signed: false,
      scale: 1,
      w: 16
    })
  })

  test('u12 wraps at word boundary', () => {
    assert(StructPropLayout('x', 'u12', 0, 24), {
      name: 'x',
      type: 'Int',
      offset: 4,
      bit: 0,
      signed: false,
      scale: 1,
      w: 12
    })
  })

  test('scale parsing u8', () => {
    assert(StructPropLayout('x', 'u8/10', 0, 0), {
      name: 'x',
      type: 'Byte',
      offset: 0,
      bit: 0,
      signed: false,
      scale: 10,
      w: 8
    })
  })

  test('scale parsing i16', () => {
    assert(StructPropLayout('x', 'i16/100', 0, 0), {
      name: 'x',
      type: 'Short',
      offset: 0,
      bit: 0,
      signed: true,
      scale: 100,
      w: 16
    })
  })

  test('f32 aligns to word', () => {
    assert(StructPropLayout('x', 'f32', 0, 8), {
      name: 'x',
      type: 'Float',
      offset: 4,
      bit: 0,
      signed: false,
      scale: 1,
      w: 32
    })
  })

  test('F16 rounds up to next byte when not byte-aligned and fits in word', () => {
    assert(StructPropLayout('x', 'f16', 0, 1), {
      name: 'x',
      type: 'Float',
      offset: 1,
      bit: 8,
      signed: false,
      scale: 1,
      w: 16
    })
  })

  test('F16 can start at any byte offset', () => {
    assert(StructPropLayout('x', 'f16', 0, 8), {
      name: 'x',
      type: 'Float',
      offset: 1,
      bit: 8,
      signed: false,
      scale: 1,
      w: 16
    })
  })

  test('F16 wraps at word boundary', () => {
    assert(StructPropLayout('x', 'f16', 0, 24), {
      name: 'x',
      type: 'Float',
      offset: 4,
      bit: 0,
      signed: false,
      scale: 1,
      w: 16
    })
  })

  for (const {name, input, expected} of [
    {
      name: 'bool',
      input: 'bool',
      expected: {
        name: 'x',
        type: 'Bool',
        offset: 0,
        bit: 0,
        signed: false,
        scale: 1,
        w: 1
      }
    },
    {
      name: 'f32',
      input: 'f32',
      expected: {
        name: 'x',
        type: 'Float',
        offset: 0,
        bit: 0,
        signed: false,
        scale: 1,
        w: 32
      }
    },
    {
      name: 'f64',
      input: 'f64',
      expected: {
        name: 'x',
        type: 'Float',
        offset: 0,
        bit: 0,
        signed: false,
        scale: 1,
        w: 64
      }
    },
    {
      name: 'f16',
      input: 'f16',
      expected: {
        name: 'x',
        type: 'Float',
        offset: 0,
        bit: 0,
        signed: false,
        scale: 1,
        w: 16
      }
    },
    {
      name: 'i1',
      input: 'i1',
      expected: {
        name: 'x',
        type: 'Int',
        offset: 0,
        bit: 0,
        signed: true,
        scale: 1,
        w: 1
      }
    },
    {
      name: 'i16/10',
      input: 'i16/10',
      expected: {
        name: 'x',
        type: 'Short',
        offset: 0,
        bit: 0,
        signed: true,
        scale: 10,
        w: 16
      }
    },
    {
      name: 'u32',
      input: 'u32',
      expected: {
        name: 'x',
        type: 'Int',
        offset: 0,
        bit: 0,
        signed: false,
        scale: 1,
        w: 32
      }
    },
    {
      name: 'u8/3',
      input: 'u8/3',
      expected: {
        name: 'x',
        type: 'Byte',
        offset: 0,
        bit: 0,
        signed: false,
        scale: 3,
        w: 8
      }
    }
  ] as const)
    test(name, () => assert(StructPropLayout('x', input, 0, 0), expected))
})
