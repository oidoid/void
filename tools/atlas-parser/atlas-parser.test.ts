import assert from 'node:assert/strict'
import {describe, test} from 'node:test'
import type {Anim, Atlas} from '../../src/graphics/atlas.ts'
import type {XY} from '../../src/types/geo.ts'
import {
  AsepriteDirection,
  type AsepriteFrameMap,
  type AsepriteTagSpan
} from './aseprite.ts'
import {
  parseAnim,
  parseAnimFrames,
  parseAtlas,
  parseCel,
  parseHitboxes
} from './atlas-parser.ts'

describe('parseAtlas()', () => {
  test('parses empty.', () => {
    assert.deepEqual<Atlas>(
      parseAtlas({
        meta: {frameTags: [], size: {w: 0, h: 0}, slices: []},
        frames: {}
      }),
      {anim: {}, cels: [], tags: []}
    )
  })

  test('parses nonempty.', () => {
    const frameTags = [
      {name: 'scenery--Cloud', from: 0, to: 0, direction: 'forward'},
      {name: 'palette--red', from: 1, to: 1, direction: 'forward'},
      {name: 'scenery--Conifer', from: 2, to: 2, direction: 'forward'},
      {name: 'scenery--ConiferShadow', from: 3, to: 3, direction: 'forward'}
    ]
    const frames = {
      'scenery--Cloud--0': {
        frame: {x: 220, y: 18, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 1
      },
      'palette--red--1': {
        frame: {x: 90, y: 54, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535
      },
      'scenery--Conifer--2': {
        frame: {x: 72, y: 54, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535
      },
      'scenery--ConiferShadow--3': {
        frame: {x: 54, y: 54, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535
      }
    }
    const slices = [
      {
        name: 'scenery--Cloud',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 8, y: 12, w: 2, h: 3}}]
      },
      {
        name: 'scenery--Cloud',
        color: '#00ff00ff',
        keys: [{frame: 0, bounds: {x: 1, y: 2, w: 3, h: 4}}]
      },
      {
        name: 'palette--red',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 7, y: 11, w: 3, h: 4}}]
      },
      {
        name: 'scenery--Conifer',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 7, y: 10, w: 3, h: 5}}]
      },
      {
        name: 'scenery--ConiferShadow',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 7, y: 9, w: 3, h: 6}}]
      }
    ]
    assert.deepEqual<Atlas>(
      parseAtlas({meta: {frameTags, size: {w: 0, h: 0}, slices}, frames}),
      {
        anim: {
          'scenery--Cloud': {
            cels: 1,
            id: 0,
            w: 16,
            h: 16,
            hitbox: {x: 8, y: 12, w: 2, h: 3},
            hurtbox: {x: 1, y: 2, w: 3, h: 4}
          },
          'palette--red': {
            cels: 1,
            id: 1,
            w: 16,
            h: 16,
            hitbox: {x: 7, y: 11, w: 3, h: 4},
            hurtbox: undefined
          },
          'scenery--Conifer': {
            cels: 1,
            id: 2,
            w: 16,
            h: 16,
            hitbox: {x: 7, y: 10, w: 3, h: 5},
            hurtbox: undefined
          },
          'scenery--ConiferShadow': {
            cels: 1,
            id: 3,
            w: 16,
            h: 16,
            hitbox: {x: 7, y: 9, w: 3, h: 6},
            hurtbox: undefined
          }
        },
        cels: [
          ...Array(16).fill([221, 19, 16, 16]),
          ...Array(16).fill([91, 55, 16, 16]),
          ...Array(16).fill([73, 55, 16, 16]),
          ...Array(16).fill([55, 55, 16, 16])
        ].flat(),
        tags: [
          'scenery--Cloud',
          'palette--red',
          'scenery--Conifer',
          'scenery--ConiferShadow'
        ]
      }
    )
  })

  test('throws Error on duplicate FrameTag.', () => {
    const frameTags = [
      {name: 'scenery--Cloud', from: 0, to: 0, direction: 'forward'},
      {name: 'palette--red', from: 1, to: 1, direction: 'forward'},
      {name: 'scenery--Cloud', from: 0, to: 0, direction: 'forward'}
    ]
    const frames = {
      'scenery--Cloud--0': {
        frame: {x: 220, y: 18, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 1
      },
      'palette--red--1': {
        frame: {x: 90, y: 54, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535
      }
    }
    assert.throws(() =>
      parseAtlas({
        meta: {frameTags, size: {w: 0, h: 0}, slices: []},
        frames
      })
    )
  })
})

describe('parseAnim()', () => {
  test('parses FrameTag, Frame from Frame[], and Slice.', () => {
    const frameTag: AsepriteTagSpan = {
      direction: 'pingpong',
      name: 'cloud--s',
      from: 1,
      to: 1
    }
    const frames = {
      'cloud--xs--0': {
        frame: {x: 202, y: 36, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535
      },
      'cloud--s--1': {
        frame: {x: 184, y: 36, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535
      },
      'cloud--m--2': {
        frame: {x: 166, y: 36, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535
      }
    }
    const slices = [
      {
        name: 'cloud--xs',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 4, y: 12, w: 7, h: 3}}]
      },
      {
        name: 'cloud--s',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 4, y: 11, w: 9, h: 4}}]
      },
      {
        name: 'cloud--m',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 3, y: 11, w: 10, h: 4}}]
      }
    ]
    assert.deepEqual<Anim>(parseAnim(16, frameTag, frames, slices), {
      cels: 1,
      id: 16,
      w: 16,
      h: 16,
      hitbox: {x: 4, y: 11, w: 9, h: 4},
      hurtbox: undefined
    })
  })

  test('throws error when no frame is associated with tag.', () => {
    const frameTag: AsepriteTagSpan = {
      direction: 'pingpong',
      name: 'frog--walk',
      from: 0,
      to: 0
    }
    assert.throws(() => parseAnim(16, frameTag, {}, []))
  })
})

describe('parseAnimFrames()', () => {
  test('single cell', () => {
    for (const direction of Object.values(AsepriteDirection)) {
      const span: AsepriteTagSpan = {
        direction,
        name: 'stem--foo',
        from: 0,
        to: 0
      }
      const map: AsepriteFrameMap = {
        'stem--foo--0': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        }
      }
      assertAnimFrames(
        span,
        map,
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        direction
      )
    }
  })

  test('full anim', () => {
    const expected: {[dir in AsepriteDirection]: number[]} = {
      forward: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      pingpong: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      pingpong_reverse: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
      reverse: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    }
    for (const direction of Object.values(AsepriteDirection)) {
      const span: AsepriteTagSpan = {
        direction,
        name: 'stem--foo',
        from: 0,
        to: 15
      }
      const map: AsepriteFrameMap = {
        'stem--foo--0': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--1': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--2': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--3': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--4': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--5': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--6': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--7': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--8': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--9': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--10': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--11': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--12': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--13': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--14': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--15': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        }
      }
      assertAnimFrames(span, map, expected[direction], direction)
    }
  })

  test('short anim', () => {
    const expected: {[dir in AsepriteDirection]: number[]} = {
      forward: [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0],
      pingpong: [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1],
      pingpong_reverse: [2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1],
      reverse: [2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2]
    }
    for (const direction of Object.values(AsepriteDirection)) {
      const span: AsepriteTagSpan = {
        direction,
        name: 'stem--foo',
        from: 0,
        to: 2
      }
      const map: AsepriteFrameMap = {
        'stem--foo--0': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--1': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--2': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        }
      }
      assertAnimFrames(span, map, expected[direction], direction)
    }
  })

  test('short anim with another anim', () => {
    const expected: {[dir in AsepriteDirection]: number[]} = {
      forward: [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1],
      pingpong: [1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2],
      pingpong_reverse: [3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2],
      reverse: [3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3]
    }
    for (const direction of Object.values(AsepriteDirection)) {
      const span: AsepriteTagSpan = {
        direction,
        name: 'stem--bar',
        from: 1,
        to: 3
      }
      const map: AsepriteFrameMap = {
        'stem--foo--0': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--bar--1': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--bar--2': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--bar--3': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        }
      }
      assertAnimFrames(span, map, expected[direction], direction)
    }
  })

  test('short anim with multi-cel durations', () => {
    const expected: {[dir in AsepriteDirection]: number[]} = {
      forward: [0, 1, 1, 2, 0, 1, 1, 2, 0, 1, 1, 2, 0, 1, 1, 2],
      pingpong: [0, 1, 1, 2, 1, 1, 0, 1, 1, 2, 1, 1, 0, 1, 1, 2],
      pingpong_reverse: [2, 1, 1, 0, 1, 1, 2, 1, 1, 0, 1, 1, 2, 1, 1, 0],
      reverse: [2, 1, 1, 0, 2, 1, 1, 0, 2, 1, 1, 0, 2, 1, 1, 0]
    }
    for (const direction of Object.values(AsepriteDirection)) {
      const span: AsepriteTagSpan = {
        direction,
        name: 'stem--foo',
        from: 0,
        to: 2
      }
      const map: AsepriteFrameMap = {
        'stem--foo--0': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--1': {
          duration: 63,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--2': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        }
      }
      assertAnimFrames(span, map, expected[direction], direction)
    }
  })
})

describe('parseCel()', () => {
  test('parses 1:1 texture mapping/', () => {
    const frame = {
      frame: {x: 1, y: 2, w: 3, h: 4},
      rotated: false,
      trimmed: false,
      spriteSourceSize: {x: 0, y: 0, w: 3, h: 4},
      sourceSize: {w: 3, h: 4},
      duration: 1
    }
    assert.deepEqual<XY>(parseCel(frame), {x: 1, y: 2})
  })

  test('parses texture mapping with padding', () => {
    const frame = {
      frame: {x: 1, y: 2, w: 5, h: 6},
      rotated: false,
      trimmed: false,
      spriteSourceSize: {x: 0, y: 0, w: 3, h: 4},
      sourceSize: {w: 3, h: 4},
      duration: 1
    }
    assert.deepEqual<XY>(parseCel(frame), {x: 2, y: 3})
  })
})

describe('parseHitboxes()', () => {
  test('parses hitbox.', () => {
    const span: AsepriteTagSpan = {
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 0
    }
    const slices = [
      {
        name: 'stem--foo',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}]
      }
    ]
    assert.deepEqual(parseHitboxes(span, slices), {
      hitbox: {x: 0, y: 1, w: 2, h: 3},
      hurtbox: undefined
    })
  })

  test('parses hurtbox.', () => {
    const span: AsepriteTagSpan = {
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 0
    }
    const slices = [
      {
        name: 'stem--foo',
        color: '#00ff00ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}]
      }
    ]
    assert.deepEqual(parseHitboxes(span, slices), {
      hitbox: undefined,
      hurtbox: {x: 0, y: 1, w: 2, h: 3}
    })
  })

  test('parses hitbox and hurtbox (blue).', () => {
    const span: AsepriteTagSpan = {
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 0
    }
    const slices = [
      {
        name: 'stem--foo',
        color: '#0000ffff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}]
      }
    ]
    assert.deepEqual(parseHitboxes(span, slices), {
      hitbox: {x: 0, y: 1, w: 2, h: 3},
      hurtbox: {x: 0, y: 1, w: 2, h: 3}
    })
  })

  test('parses hitbox and hurtbox.', () => {
    const span: AsepriteTagSpan = {
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 0
    }
    const slices = [
      {
        name: 'stem--foo',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}]
      },
      {
        name: 'stem--foo',
        color: '#00ff00ff',
        keys: [{frame: 0, bounds: {x: 4, y: 5, w: 6, h: 7}}]
      }
    ]
    assert.deepEqual(parseHitboxes(span, slices), {
      hitbox: {x: 0, y: 1, w: 2, h: 3},
      hurtbox: {x: 4, y: 5, w: 6, h: 7}
    })
  })

  test('filters out unrelated tags.', () => {
    const span: AsepriteTagSpan = {
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 0
    }
    const slices = [
      {
        name: 'unrelated--bar',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}]
      },
      {
        name: 'stem--foo',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 4, y: 5, w: 6, h: 7}}]
      }
    ]
    assert.deepEqual(parseHitboxes(span, slices), {
      hitbox: {x: 4, y: 5, w: 6, h: 7},
      hurtbox: undefined
    })
  })

  test('throws on frame with multiple keys.', () => {
    const span: AsepriteTagSpan = {
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 2
    }
    const slices = [
      {
        name: 'stem--foo',
        color: '0000ffff',
        keys: [
          {frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}},
          {frame: 1, bounds: {x: 4, y: 5, w: 6, h: 7}},
          {frame: 2, bounds: {x: 8, y: 9, w: 10, h: 11}}
        ]
      }
    ]
    assert.throws(() => parseHitboxes(span, slices))
  })

  test('defaults to undefined hitbox.', () => {
    const span: AsepriteTagSpan = {
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 0
    }
    assert.deepEqual(parseHitboxes(span, []), {
      hitbox: undefined,
      hurtbox: undefined
    })
  })

  test('throws on unsupported color.', () => {
    const span: AsepriteTagSpan = {
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 0
    }
    const slices = [
      {
        name: 'stem--foo',
        color: '#ff00ffff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}]
      }
    ]
    assert.throws(() => parseHitboxes(span, slices))
  })

  test('throws on multiple hitboxes.', () => {
    const span: AsepriteTagSpan = {
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 1
    }
    const slices = [
      {
        name: 'stem--foo',
        color: '#ff0000ff',
        keys: [
          {frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}},
          {frame: 1, bounds: {x: 4, y: 5, w: 6, h: 7}},
          {frame: 2, bounds: {x: 12, y: 13, w: 14, h: 15}}
        ]
      },
      {
        name: 'stem--foo',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}]
      }
    ]
    assert.throws(() => parseHitboxes(span, slices))
  })

  test('throws on multiple hurtboxes.', () => {
    const span: AsepriteTagSpan = {
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 1
    }
    const slices = [
      {
        name: 'stem--foo',
        color: '#00ff00ff',
        keys: [
          {frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}},
          {frame: 1, bounds: {x: 4, y: 5, w: 6, h: 7}},
          {frame: 2, bounds: {x: 12, y: 13, w: 14, h: 15}}
        ]
      },
      {
        name: 'stem--foo',
        color: '#00ff00ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}]
      }
    ]
    assert.throws(() => parseHitboxes(span, slices))
  })
})

function assertAnimFrames(
  span: Readonly<AsepriteTagSpan>,
  map: Readonly<AsepriteFrameMap>,
  expected: number[],
  msg?: string | undefined
): void {
  assert.deepEqual(
    [...parseAnimFrames(span, map)].map(frame =>
      Object.values(map).indexOf(frame)
    ),
    expected,
    msg
  )
}
