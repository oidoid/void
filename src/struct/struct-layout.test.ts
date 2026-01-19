import test, {describe} from 'node:test'
import {assert} from '../test/assert.ts'
import {StructLayout, StructPropLayout} from './struct-layout.ts'
import type {StructSchema} from './struct-schema.ts'

describe('StructLayout()', () => {
  for (const {name, input, expected} of [
    {
      name: 'empty struct',
      input: {SID: 'SID'} satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'SID',
            type: 'SID',
            offset: 0,
            bit: 0,
            signed: false,
            scale: 1,
            w: 32
          }
        ],
        size: 4
      } satisfies StructLayout
    },
    {
      name: 'packs bools densely within a word',
      input: {
        A: 'Bool',
        B: 'Bool',
        C: 'Bool',
        SID: 'SID'
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
          },
          {
            name: 'SID',
            type: 'SID',
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
      name: 'does not straddle word boundary',
      input: {A: 'U31', B: 'U2', SID: 'SID'} satisfies StructSchema,
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
          },
          {
            name: 'SID',
            type: 'SID',
            offset: 8,
            bit: 0,
            signed: false,
            scale: 1,
            w: 32
          }
        ],
        size: 12
      } satisfies StructLayout
    },
    {
      name: 'allows exact end-of-word packing',
      input: {A: 'U31', B: 'Bool', SID: 'SID'} satisfies StructSchema,
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
          },
          {
            name: 'SID',
            type: 'SID',
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
      name: 'U32 occupies a full word',
      input: {A: 'U32', B: 'U1', SID: 'SID'} satisfies StructSchema,
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
          },
          {
            name: 'SID',
            type: 'SID',
            offset: 8,
            bit: 0,
            signed: false,
            scale: 1,
            w: 32
          }
        ],
        size: 12
      } satisfies StructLayout
    },
    {
      name: 'F32 occupies a full word aligned to word boundaries',
      input: {A: 'U1', B: 'F32', SID: 'SID'} satisfies StructSchema,
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
          },
          {
            name: 'SID',
            type: 'SID',
            offset: 8,
            bit: 0,
            signed: false,
            scale: 1,
            w: 32
          }
        ],
        size: 12
      } satisfies StructLayout
    },
    {
      name: 'F16 is byte-aligned and can pack with another f16 within the same word',
      input: {A: 'F16', B: 'F16', SID: 'SID'} satisfies StructSchema,
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
          },
          {
            name: 'SID',
            type: 'SID',
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
      name: 'F16 follows byte alignment: after a U8 it starts at the next byte boundary',
      input: {A: 'U8', B: 'F16', SID: 'SID'} satisfies StructSchema,
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
          },
          {
            name: 'SID',
            type: 'SID',
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
      name: 'F16 rounds up to next byte after a Bool when it fits in the current word',
      input: {A: 'Bool', B: 'F16', SID: 'SID'} satisfies StructSchema,
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
          },
          {
            name: 'SID',
            type: 'SID',
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
      name: 'F16 does not straddle word boundary',
      input: {A: 'U24', B: 'F16', SID: 'SID'} satisfies StructSchema,
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
          },
          {
            name: 'SID',
            type: 'SID',
            offset: 8,
            bit: 0,
            signed: false,
            scale: 1,
            w: 32
          }
        ],
        size: 12
      } satisfies StructLayout
    },
    {
      name: 'F64 aligns to word boundary and occupies 8 bytes',
      input: {A: 'U1', B: 'F64', C: 'U1', SID: 'SID'} satisfies StructSchema,
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
          },
          {
            name: 'SID',
            type: 'SID',
            offset: 16,
            bit: 0,
            signed: false,
            scale: 1,
            w: 32
          }
        ],
        size: 20
      } satisfies StructLayout
    },
    {
      name: 'strings and objects are 32b',
      input: {S: 'String', O: 'Object', SID: 'SID'} satisfies StructSchema,
      expected: {
        props: [
          {
            name: 'S',
            type: 'String',
            offset: 0,
            bit: 0,
            signed: false,
            scale: 1,
            w: 32
          },
          {
            name: 'O',
            type: 'Object',
            offset: 4,
            bit: 0,
            signed: false,
            scale: 1,
            w: 32
          },
          {
            name: 'SID',
            type: 'SID',
            offset: 8,
            bit: 0,
            signed: false,
            scale: 1,
            w: 32
          }
        ],
        size: 12
      } satisfies StructLayout
    },
    {
      name: 'Byte and Short layouts on byte boundaries',
      input: {A: 'U8', B: 'U16', C: 'U8', SID: 'SID'} satisfies StructSchema,
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
          },
          {
            name: 'SID',
            type: 'SID',
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
      name: 'Byte then Int: Int uses the containing word offset (0)',
      input: {A: 'U8', B: 'U1', SID: 'SID'} satisfies StructSchema,
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
          },
          {
            name: 'SID',
            type: 'SID',
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
      name: 'Byte then Short: Short can start at byte offset 1',
      input: {A: 'U8', B: 'U16', SID: 'SID'} satisfies StructSchema,
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
            name: 'SID',
            type: 'SID',
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
      name: '32 bools fill the word exactly; the next bool starts next word',
      input: {
        ...Object.fromEntries([...Array(33)].map((_, i) => [`B${i}`, 'Bool'])),
        SID: 'SID' as const
      },
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
          },
          {
            name: 'SID',
            type: 'SID',
            offset: 8,
            bit: 0,
            signed: false,
            scale: 1,
            w: 32
          }
        ],
        size: 12
      } satisfies StructLayout
    },
    {
      name: 'scaled ints keep scale and pack as normal',
      input: {
        A: 'I8/2',
        B: 'U8/3',
        C: 'U16/10',
        SID: 'SID'
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
          },
          {
            name: 'SID',
            type: 'SID',
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
      name: 'mixed packing and size rounding',
      input: {A: 'U31', B: 'U1', C: 'F32', SID: 'SID'} satisfies StructSchema,
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
          },
          {
            name: 'SID',
            type: 'SID',
            offset: 8,
            bit: 0,
            signed: false,
            scale: 1,
            w: 32
          }
        ],
        size: 12
      } satisfies StructLayout
    },
    {
      name: 'mixed packing and size rounding (F16)',
      input: {A: 'U31', B: 'U1', C: 'F16', SID: 'SID'} satisfies StructSchema,
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
          },
          {
            name: 'SID',
            type: 'SID',
            offset: 8,
            bit: 0,
            signed: false,
            scale: 1,
            w: 32
          }
        ],
        size: 12
      } satisfies StructLayout
    }
  ] as const)
    test(name, () => assert(StructLayout(input), expected))

  test('sprite struct', () => {
    assert(
      StructLayout({
        X: 'I24/64', // [-131072, 131071.984375] (1/64th fixed-point). 1b sign,
        //              17b int, 6b fraction.
        Zend: 'Bool',
        Z: 'U4',
        // 3b unused.
        Y: 'I24/64',
        // 8b unused.
        Hidden: 'Bool',
        Stretch: 'Bool',
        FlipX: 'Bool',
        FlipY: 'Bool',
        W: 'U12',
        H: 'U12',
        // 4b unused
        Anim: 'U11',
        Cel: 'U5',
        Angle: 'U12',
        SID: 'SID'
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
          },
          {
            name: 'SID',
            type: 'SID',
            offset: 16,
            bit: 0,
            signed: false,
            scale: 1,
            w: 32
          }
        ],
        size: 20
      }
    )
  })
})

describe('StructPropLayout()', () => {
  test('u8 at bit 0 is Byte', () => {
    assert(StructPropLayout('x', 'U8', 0, 0), {
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
    assert(StructPropLayout('x', 'U16', 0, 8), {
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
    assert(StructPropLayout('x', 'U16', 0, 1), {
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
    assert(StructPropLayout('x', 'Bool', 0, 32), {
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
    assert(StructPropLayout('x', 'U8', 0, 1), {
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
    assert(StructPropLayout('x', 'U16', 0, 16), {
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
    assert(StructPropLayout('x', 'U12', 0, 24), {
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
    assert(StructPropLayout('x', 'U8/10', 0, 0), {
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
    assert(StructPropLayout('x', 'I16/100', 0, 0), {
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
    assert(StructPropLayout('x', 'F32', 0, 8), {
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
    assert(StructPropLayout('x', 'F16', 0, 1), {
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
    assert(StructPropLayout('x', 'F16', 0, 8), {
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
    assert(StructPropLayout('x', 'F16', 0, 24), {
      name: 'x',
      type: 'Float',
      offset: 4,
      bit: 0,
      signed: false,
      scale: 1,
      w: 16
    })
  })

  test('string is 32-bit ref', () => {
    assert(StructPropLayout('x', 'String', 0, 0), {
      name: 'x',
      type: 'String',
      offset: 0,
      bit: 0,
      signed: false,
      scale: 1,
      w: 32
    })
  })

  test('object is 32-bit ref', () => {
    assert(StructPropLayout('x', 'Object', 0, 0), {
      name: 'x',
      type: 'Object',
      offset: 0,
      bit: 0,
      signed: false,
      scale: 1,
      w: 32
    })
  })

  for (const {name, input, expected} of [
    {
      name: 'bool',
      input: 'Bool',
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
      name: 'F32',
      input: 'F32',
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
      name: 'F64',
      input: 'F64',
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
      name: 'F16',
      input: 'F16',
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
      name: 'I1',
      input: 'I1',
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
      input: 'I16/10',
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
      name: 'object',
      input: 'Object',
      expected: {
        name: 'x',
        type: 'Object',
        offset: 0,
        bit: 0,
        signed: false,
        scale: 1,
        w: 32
      }
    },
    {
      name: 'string',
      input: 'String',
      expected: {
        name: 'x',
        type: 'String',
        offset: 0,
        bit: 0,
        signed: false,
        scale: 1,
        w: 32
      }
    },
    {
      name: 'u32',
      input: 'U32',
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
      input: 'U8/3',
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
