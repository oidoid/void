import { assertEquals, assertThrows } from 'std/testing/asserts.ts'
import { AsepriteTagSpan } from './aseprite.ts'
import { parseAnim, parseAtlas, parseCel, parseHitbox } from './atlas.ts'

Deno.test('parseAtlas()', async (test) => {
  await test.step('parses empty', () => {
    assertEquals(
      parseAtlas({ meta: { frameTags: [], slices: [] }, frames: {} }),
      {},
    )
  })

  await test.step('parses nonempty', () => {
    const frameTags = [
      { name: 'scenery--Cloud', from: 0, to: 0, direction: 'forward' },
      { name: 'palette--red', from: 1, to: 1, direction: 'forward' },
      { name: 'scenery--Conifer', from: 2, to: 2, direction: 'forward' },
      { name: 'scenery--ConiferShadow', from: 3, to: 3, direction: 'forward' },
    ]
    const frames = {
      'scenery--Cloud--0': {
        frame: { x: 220, y: 18, w: 18, h: 18 },
        spriteSourceSize: { x: 0, y: 0, w: 16, h: 16 },
        sourceSize: { w: 16, h: 16 },
        duration: 1,
      },
      'palette--red--1': {
        frame: { x: 90, y: 54, w: 18, h: 18 },
        spriteSourceSize: { x: 0, y: 0, w: 16, h: 16 },
        sourceSize: { w: 16, h: 16 },
        duration: 65535,
      },
      'scenery--Conifer--2': {
        frame: { x: 72, y: 54, w: 18, h: 18 },
        spriteSourceSize: { x: 0, y: 0, w: 16, h: 16 },
        sourceSize: { w: 16, h: 16 },
        duration: 65535,
      },
      'scenery--ConiferShadow--3': {
        frame: { x: 54, y: 54, w: 18, h: 18 },
        spriteSourceSize: { x: 0, y: 0, w: 16, h: 16 },
        sourceSize: { w: 16, h: 16 },
        duration: 65535,
      },
    }
    const slices = [
      {
        name: 'scenery--Cloud',
        color: '#0000ffff',
        keys: [{ frame: 0, bounds: { x: 8, y: 12, w: 2, h: 3 } }],
      },
      {
        name: 'palette--red',
        color: '#0000ffff',
        keys: [{ frame: 0, bounds: { x: 7, y: 11, w: 3, h: 4 } }],
      },
      {
        name: 'scenery--Conifer',
        color: '#0000ffff',
        keys: [{ frame: 0, bounds: { x: 7, y: 10, w: 3, h: 5 } }],
      },
      {
        name: 'scenery--ConiferShadow',
        color: '#0000ffff',
        keys: [{ frame: 0, bounds: { x: 7, y: 9, w: 3, h: 6 } }],
      },
    ]
    assertEquals(
      parseAtlas({ meta: { frameTags, slices }, frames }),
      {
        'scenery--Cloud': {
          id: 0x00,
          tag: 'scenery--Cloud',
          w: 16,
          h: 16,
          cels: [{ x: 221, y: 19 }],
          hitbox: { x: 8, y: 12, w: 2, h: 3 },
        },
        'palette--red': {
          id: 0x10,
          tag: 'palette--red',
          w: 16,
          h: 16,
          cels: [{ x: 91, y: 55 }],
          hitbox: { x: 7, y: 11, w: 3, h: 4 },
        },
        'scenery--Conifer': {
          id: 0x20,
          tag: 'scenery--Conifer',
          w: 16,
          h: 16,
          cels: [{ x: 73, y: 55 }],
          hitbox: { x: 7, y: 10, w: 3, h: 5 },
        },
        'scenery--ConiferShadow': {
          id: 0x30,
          tag: 'scenery--ConiferShadow',
          w: 16,
          h: 16,
          cels: [{ x: 55, y: 55 }],
          hitbox: { x: 7, y: 9, w: 3, h: 6 },
        },
      },
    )
  })

  await test.step('Throws Error on duplicate FrameTag.', () => {
    const frameTags = [
      { name: 'scenery--Cloud', from: 0, to: 0, direction: 'forward' },
      { name: 'palette--red', from: 1, to: 1, direction: 'forward' },
      { name: 'scenery--Cloud', from: 0, to: 0, direction: 'forward' },
    ]
    const frames = {
      'scenery--Cloud--0': {
        frame: { x: 220, y: 18, w: 18, h: 18 },
        spriteSourceSize: { x: 0, y: 0, w: 16, h: 16 },
        sourceSize: { w: 16, h: 16 },
        duration: 1,
      },
      'palette--red--1': {
        frame: { x: 90, y: 54, w: 18, h: 18 },
        spriteSourceSize: { x: 0, y: 0, w: 16, h: 16 },
        sourceSize: { w: 16, h: 16 },
        duration: 65535,
      },
    }
    assertThrows(() => parseAtlas({ meta: { frameTags, slices: [] }, frames }))
  })
})

Deno.test('parseAnim()', async (test) => {
  await test.step('Parses FrameTag, Frame from Frame[], and Slice.', () => {
    const frameTag: AsepriteTagSpan = {
      name: 'cloud--s',
      from: 1,
      to: 1,
    }
    const frames = {
      'cloud--xs--0': {
        frame: { x: 202, y: 36, w: 18, h: 18 },
        spriteSourceSize: { x: 0, y: 0, w: 16, h: 16 },
        sourceSize: { w: 16, h: 16 },
        duration: 65535,
      },
      'cloud--s--1': {
        frame: { x: 184, y: 36, w: 18, h: 18 },
        spriteSourceSize: { x: 0, y: 0, w: 16, h: 16 },
        sourceSize: { w: 16, h: 16 },
        duration: 65535,
      },
      'cloud--m--2': {
        frame: { x: 166, y: 36, w: 18, h: 18 },
        spriteSourceSize: { x: 0, y: 0, w: 16, h: 16 },
        sourceSize: { w: 16, h: 16 },
        duration: 65535,
      },
    }
    const slices = [
      {
        name: 'cloud--xs',
        color: '#0000ffff',
        keys: [{ frame: 0, bounds: { x: 4, y: 12, w: 7, h: 3 } }],
      },
      {
        name: 'cloud--s',
        color: '#0000ffff',
        keys: [{ frame: 0, bounds: { x: 4, y: 11, w: 9, h: 4 } }],
      },
      {
        name: 'cloud--m',
        color: '#0000ffff',
        keys: [{ frame: 0, bounds: { x: 3, y: 11, w: 10, h: 4 } }],
      },
    ] as const
    assertEquals(
      parseAnim(
        16,
        frameTag,
        frames,
        slices,
      ),
      {
        id: 16,
        w: 16,
        h: 16,
        cels: [{ x: 185, y: 37 }],
        hitbox: { x: 4, y: 11, w: 9, h: 4 },
        tag: 'cloud--s',
      },
    )
  })

  await test.step('throws error when no frame is associated with tag', () => {
    const frameTag: AsepriteTagSpan = { name: 'frog--walk', from: 0, to: 0 }
    assertThrows(() => parseAnim(16, frameTag, {}, []))
  })
})

Deno.test('parseCel()', async (test) => {
  await test.step('parses 1:1 texture mapping', () => {
    const frame = {
      frame: { x: 1, y: 2, w: 3, h: 4 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 3, h: 4 },
      sourceSize: { w: 3, h: 4 },
      duration: 1,
    }
    assertEquals(parseCel(frame), { x: 1, y: 2 })
  })

  await test.step('parses texture mapping with padding', () => {
    const frame = {
      frame: { x: 1, y: 2, w: 5, h: 6 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 3, h: 4 },
      sourceSize: { w: 3, h: 4 },
      duration: 1,
    }
    assertEquals(parseCel(frame), { x: 2, y: 3 })
  })
})

Deno.test('parseHitbox()', async (test) => {
  await test.step('converts to hitbox', () => {
    const span: AsepriteTagSpan = { name: 'stem--foo', from: 0, to: 0 }
    const slices = [
      {
        name: 'stem--foo',
        color: '#00000000',
        keys: [{ frame: 0, bounds: { x: 0, y: 1, w: 2, h: 3 } }],
      },
    ] as const
    assertEquals(parseHitbox(span, slices), { x: 0, y: 1, w: 2, h: 3 })
  })

  await test.step('filters out unrelated tags', () => {
    const span: AsepriteTagSpan = { name: 'stem--foo', from: 0, to: 0 }
    const slices = [
      {
        name: 'unrelated--bar',
        color: '#00000000',
        keys: [{ frame: 0, bounds: { x: 0, y: 1, w: 2, h: 3 } }],
      },
      {
        name: 'stem--foo',
        color: '#00000000',
        keys: [{ frame: 0, bounds: { x: 4, y: 5, w: 6, h: 7 } }],
      },
    ] as const
    assertEquals(parseHitbox(span, slices), { x: 4, y: 5, w: 6, h: 7 })
  })

  await test.step('throws on frame with multiple keys', () => {
    const span: AsepriteTagSpan = { name: 'stem--foo', from: 0, to: 2 }
    const slices = [
      {
        name: 'stem--foo',
        color: '#00000000',
        keys: [
          { frame: 0, bounds: { x: 0, y: 1, w: 2, h: 3 } },
          { frame: 1, bounds: { x: 4, y: 5, w: 6, h: 7 } },
          { frame: 2, bounds: { x: 8, y: 9, w: 10, h: 11 } },
        ],
      },
    ] as const
    assertThrows(() => parseHitbox(span, slices))
  })

  await test.step('defaults to empty hitbox', () => {
    const span: AsepriteTagSpan = { name: 'stem--foo', from: 0, to: 0 }
    assertEquals(parseHitbox(span, []), { x: 0, y: 0, w: 0, h: 0 })
  })

  await test.step('throws on multiple hitboxes', () => {
    const span: AsepriteTagSpan = { name: 'stem--foo', from: 0, to: 1 }
    const slices = [
      {
        name: 'stem--foo',
        color: '#00000000',
        keys: [
          { frame: 0, bounds: { x: 0, y: 1, w: 2, h: 3 } },
          { frame: 1, bounds: { x: 4, y: 5, w: 6, h: 7 } },
          { frame: 2, bounds: { x: 12, y: 13, w: 14, h: 15 } },
        ],
      },
      {
        name: 'unrelated--bar',
        color: '#00000000',
        keys: [{ frame: 0, bounds: { x: 0, y: 1, w: 2, h: 3 } }],
      },
      {
        name: 'stem--foo',
        color: '#00000000',
        keys: [{ frame: 1, bounds: { x: 0, y: 1, w: 2, h: 3 } }],
      },
      {
        name: 'stem--foo',
        color: '#00000000',
        keys: [{ frame: 0, bounds: { x: 8, y: 9, w: 10, h: 11 } }],
      },
    ] as const
    assertThrows(() => parseHitbox(span, slices))
  })
})
