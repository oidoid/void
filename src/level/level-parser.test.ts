import {describe, test} from 'node:test'
import type {Button, Ent} from '../ents/ent.ts'
import type {Anim, Atlas} from '../graphics/atlas.ts'
import {Layer} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import type {Pool} from '../mem/pool.ts'
import type {PoolMap} from '../mem/pool-map.ts'
import {SpritePool} from '../mem/sprite-pool.ts'
import {assert} from '../test/assert.ts'
import type {Box} from '../types/geo.ts'
import {
  type ComponentHook,
  parseBorder,
  parseButton,
  parseCursor,
  parseEnt,
  parseEntComponent,
  parseHUD,
  parseLevel,
  parseNinePatch,
  parseOverride,
  parseSprite,
  parseTextWH,
  parseTextXY,
  parseWH,
  parseXY
} from './level-parser.ts'
import type {EntSchema, SpriteSchema} from './level-schema.ts'

declare module '../ents/ent.ts' {
  interface Ent {
    widget?: number
  }
}

declare module './level-schema.ts' {
  interface EntSchema {
    widget?: {gears: number}
  }
}

declare module '../mem/pool-map.ts' {
  interface PoolMap {
    secondary: Pool<Sprite>
  }
}

const animA: Readonly<Anim> = {cels: 4, id: 0, w: 10, h: 20}

const atlas: Readonly<Atlas> = {
  anim: {'stem--A': animA, 'stem--B': {cels: 8, id: 1, w: 30, h: 40}},
  celXYWH: [],
  tags: ['stem--A', 'stem--B']
}

test('parseBorder()', () => {
  assert(parseBorder(3), {n: 3, s: 3, w: 3, e: 3})
  assert(parseBorder({x: 2, y: 1}), {n: 1, s: 1, w: 2, e: 2})
  assert(parseBorder({n: 4, w: 5}), {n: 4, s: 0, w: 5, e: 0})
})

test('parseButton()', () => {
  const pools = TestPools()
  const a = parseButton(
    {type: 'Toggle', pressed: {tag: 'stem--A'}, selected: 'stem--B'},
    pools,
    atlas
  )
  assert(a.type, 'Toggle')
  assert(a.pressed.tag, 'stem--A')
  assert(a.selected.tag, 'stem--B')

  const b = parseButton({pressed: 'stem--A', selected: 'stem--B'}, pools, atlas)
  assert(b.type, 'Button')
  assert(b.pressed.tag, 'stem--A')
  assert(b.selected.tag, 'stem--B')
})

test('parseEnt() with parseComponent override hook', () => {
  const pools = TestPools()
  const json: EntSchema = {
    name: 'X',
    sprite: 'stem--A',
    widget: {gears: 5}
  }

  // no hook.
  let ent = parseEnt(json, pools, () => undefined, atlas)
  assert(ent.name, 'X')
  assert(ent.sprite?.tag, 'stem--A')
  assert((ent as {widget: number}).widget, undefined)

  // hook.
  ent = parseEnt(
    json,
    pools,
    (_ent, json, k) => {
      if (json[k] == null) return
      if (k === 'widget') return json[k].gears satisfies Ent[typeof k]
    },
    atlas
  )
  assert(ent.name, 'X')
  assert(ent.sprite?.tag, 'stem--A')
  assert((ent as {widget: number}).widget, 5)
})

test('parseEnt() preserves key insertion order', () => {
  const pools = TestPools()
  const hook: ComponentHook = (_ent, json, k) => {
    if (json[k] == null) return
    if (k === 'widget') return json[k].gears satisfies Ent[typeof k]
  }

  const a: EntSchema = {
    name: 'Name',
    id: '1',
    text: 'hello',
    button: {pressed: 'stem--A', selected: 'stem--B'},
    sprite: 'stem--A',
    ninePatch: {border: 1, patch: {}},
    hud: {origin: 'N'},
    cursor: {keyboard: 1, pick: 'stem--B'},
    widget: {gears: 3},
    textWH: {maxW: 100, scale: 2}
  }
  assert(Object.keys(parseEnt(a, pools, hook, atlas)), [
    ...Object.keys(a),
    'invalid'
  ])

  const b: EntSchema = {
    widget: {gears: 3},
    text: 'first',
    sprite: 'stem--B',
    name: 'Second',
    id: '2',
    textWH: {},
    button: {pressed: 'stem--A', selected: 'stem--B'}
  }
  assert(Object.keys(parseEnt(b, pools, hook, atlas)), [
    ...Object.keys(b),
    'invalid'
  ])

  const c: EntSchema = {name: 'name', id: '2'}
  assert(Object.keys(parseEnt(c, pools, hook, atlas)), [
    'name',
    'id',
    'invalid'
  ])
})

test('parseEntComponent()', () => {
  const pools = TestPools()
  const json: EntSchema = {
    id: '1',
    name: 'Name',
    text: 'text',
    sprite: 'stem--A',
    ninePatch: {border: 1, patch: {}},
    hud: {margin: 2, origin: 'N'},
    cursor: {keyboard: 1, pick: 'stem--B'},
    textWH: {maxW: 100, scale: 2},
    button: {pressed: 'stem--A', selected: 'stem--B', type: 'Toggle'}
  }

  assert(parseEntComponent({}, json, 'id', pools, atlas), '1')
  assert(parseEntComponent({}, json, 'name', pools, atlas), 'Name')
  assert(parseEntComponent({}, json, 'text', pools, atlas), 'text')
  assert(
    (parseEntComponent({}, json, 'sprite', pools, atlas) as Sprite).tag,
    'stem--A'
  )
  assert(
    parseEntComponent(
      {sprite: parseSprite('stem--A', pools, atlas)},
      json,
      'ninePatch',
      pools,
      atlas
    ),
    {
      border: {n: 1, s: 1, w: 1, e: 1},
      pad: {n: 0, s: 0, w: 0, e: 0},
      patch: {
        center: undefined,
        n: undefined,
        s: undefined,
        w: undefined,
        e: undefined,
        nw: undefined,
        ne: undefined,
        sw: undefined,
        se: undefined
      }
    }
  )
  assert(parseEntComponent({}, json, 'hud', pools, atlas), {
    fill: undefined,
    margin: {n: 2, s: 2, w: 2, e: 2},
    modulo: {x: 0, y: 0},
    origin: 'N'
  })
  assert(
    parseEntComponent(
      {sprite: parseSprite('stem--B', pools, atlas)},
      json,
      'cursor',
      pools,
      atlas
    ),
    {
      bounds: {x: 0, y: 0, w: 0, h: 0},
      keyboard: 1,
      pick: 'stem--B',
      point: 'stem--B'
    }
  )
  assert(parseEntComponent({}, json, 'textWH', pools, atlas), {
    layout: {chars: [], cursor: {x: 0, y: 0}, w: 0, h: 0, trimmedH: 0},
    maxW: 100,
    pad: {n: 0, s: 0, w: 0, e: 0},
    scale: 2,
    trim: undefined
  })
  assert(
    (parseEntComponent({}, json, 'button', pools, atlas) as Button).type,
    'Toggle'
  )

  assert(
    parseEntComponent({}, {}, 'missing' as keyof EntSchema, pools, atlas),
    undefined
  )
})

test('parseCursor()', () => {
  const pools = TestPools()
  assert(parseCursor({sprite: parseSprite('stem--A', pools, atlas)}, {}), {
    bounds: {x: 0, y: 0, w: 0, h: 0},
    keyboard: 0,
    pick: undefined,
    point: 'stem--A'
  })
  assert(
    parseCursor(
      {sprite: parseSprite('stem--A', pools, atlas)},
      {keyboard: 2, pick: 'stem--B'}
    ),
    {
      bounds: {x: 0, y: 0, w: 0, h: 0},
      keyboard: 2,
      pick: 'stem--B',
      point: 'stem--A'
    }
  )
})

test('parseHUD()', () => {
  assert(parseHUD({origin: 'Center'}), {
    fill: undefined,
    margin: {n: 0, s: 0, w: 0, e: 0},
    modulo: {x: 0, y: 0},
    origin: 'Center'
  })

  assert(parseHUD({fill: 'XY', margin: 3, modulo: 5, origin: 'NE'}), {
    fill: 'XY',
    margin: {n: 3, s: 3, w: 3, e: 3},
    modulo: {x: 5, y: 5},
    origin: 'NE'
  })

  assert(parseHUD({margin: {w: 1}, modulo: {y: 2}, origin: 'S'}), {
    fill: undefined,
    margin: {n: 0, s: 0, w: 1, e: 0},
    modulo: {x: 0, y: 2},
    origin: 'S'
  })

  assert(parseHUD({margin: {y: 1}, modulo: {}, origin: 'S'}), {
    fill: undefined,
    margin: {n: 1, s: 1, w: 0, e: 0},
    modulo: {x: 0, y: 0},
    origin: 'S'
  })
})

test('parseLevel() aggregates ents and defaults', () => {
  const pools = TestPools()
  const lvl = parseLevel(
    {
      zoo: {
        default: [
          {id: 'a', sprite: 'stem--A'},
          {id: 'b', text: 'hello'}
        ]
      },
      minWH: {w: 3}
    },
    pools,
    () => undefined,
    atlas
  )
  assert(lvl.zoo.default.size, 2)
  assert(lvl.minWH, {w: 3, h: 0})
  const ents = [...lvl.zoo.default]
  assert(ents[0]?.sprite?.tag, 'stem--A')
  assert(ents[1]?.text, 'hello')

  const emptyLvl = parseLevel(
    {zoo: {default: []}},
    pools,
    () => undefined,
    atlas
  )
  assert(emptyLvl, {
    background: undefined,
    minScale: undefined,
    minWH: undefined,
    zoo: {default: new Set<Ent>()},
    zoomOut: undefined
  })
})

test('parseNinePatch()', () => {
  const pools = TestPools()

  // number border and margin.
  const nineA = parseNinePatch(
    {sprite: parseSprite('stem--A', pools, atlas)},
    {
      border: 2,
      pad: 3,
      patch: {center: {tag: 'stem--A'}, n: {tag: 'stem--B'}}
    },
    pools,
    atlas
  )
  assert(nineA.border, {n: 2, s: 2, w: 2, e: 2})
  assert(nineA.pad, {n: 3, s: 3, w: 3, e: 3})
  assert(nineA.patch.center?.tag, 'stem--A')
  assert(nineA.patch.n?.tag, 'stem--B')
  assert(nineA.patch.s, undefined)
  assert(nineA.patch.w, undefined)
  assert(nineA.patch.e, undefined)
  assert(nineA.patch.nw, undefined)
  assert(nineA.patch.ne, undefined)
  assert(nineA.patch.sw, undefined)
  assert(nineA.patch.se, undefined)

  // object border and pad.
  const nineB = parseNinePatch(
    {sprite: parseSprite('stem--A', pools, atlas)},
    {
      border: {n: 1, s: 2, w: 3, e: 4},
      pad: {w: 7},
      patch: {nw: 'stem--A', se: 'stem--B'}
    },
    pools,
    atlas
  )
  assert(nineB.border, {n: 1, s: 2, w: 3, e: 4})
  assert(nineB.pad, {n: 0, s: 0, w: 7, e: 0})
  assert(nineB.patch.nw?.tag, 'stem--A')
  assert(nineB.patch.se?.tag, 'stem--B')
})

describe('parseSprite()', () => {
  test('tag', () => {
    const sprite = parseSprite('stem--A', TestPools(), atlas)
    assert(sprite.tag, 'stem--A')
    assert(sprite.w, animA.w)
    assert(sprite.h, animA.h)
  })

  test('object', () => {
    const json: Required<SpriteSchema> & Box & {scale: number} = {
      angle: 90,
      flip: 'XY',
      pool: 'Default',
      stretch: true,
      tag: 'stem--B',
      hidden: true,
      z: 'UIA',
      zend: true,
      x: 5,
      y: 6,
      w: 7,
      h: 8,
      scale: 2
    }
    const sprite = parseSprite(json, TestPools(), atlas)
    assert(sprite.tag, 'stem--B')
    assert(sprite.hidden, true)
    assert(sprite.flipX, true)
    assert(sprite.flipY, true)
    assert(sprite.stretch, true)
    assert(sprite.angle, 90)
    assert(sprite.x, 5)
    assert(sprite.y, 6)
    assert(sprite.w, 7 * 2)
    assert(sprite.h, 8 * 2)
    assert(sprite.z, Layer.UIA)
    assert(sprite.zend, true)
  })

  test('nondefault pool', () => {
    const sprite = parseSprite(
      {pool: 'Secondary', tag: 'stem--A'},
      TestPools(),
      atlas
    )
    assert(sprite.tag, 'stem--A')
  })

  test('missing pool', () =>
    assert.throws(
      () => parseSprite({pool: 'Missing', tag: 'stem--A'}, TestPools(), atlas),
      /no missing sprite pool/
    ))
})

test('parseOverride()', () => {
  assert(parseOverride({}), {invalid: undefined})
  assert(parseOverride({invalid: true}), {invalid: true})
})

test('parseTextUI()', () => {
  assert(parseTextWH({}), {
    maxW: 4095,
    scale: 1,
    layout: {chars: [], cursor: {x: 0, y: 0}, w: 0, h: 0, trimmedH: 0},
    pad: {n: 0, s: 0, w: 0, e: 0},
    trim: undefined
  })
  assert(
    parseTextWH({
      maxW: 100,
      scale: 2,
      trim: 'Leading',
      pad: {n: 1, s: 2, w: 3, e: 4}
    }),
    {
      maxW: 100,
      scale: 2,
      trim: 'Leading',
      layout: {chars: [], cursor: {x: 0, y: 0}, w: 0, h: 0, trimmedH: 0},
      pad: {n: 1, s: 2, w: 3, e: 4}
    }
  )
})

test('parseTextXY()', () => {
  const pools = TestPools()

  // defaults when no ent.sprite.
  assert(parseTextXY({}, {}), {chars: [], z: Layer.Bottom})

  // uses ent.sprite.z when available.
  const sprite = parseSprite('stem--A', pools, atlas)
  sprite.z = Layer.UIA
  assert(parseTextXY({sprite}, {}), {chars: [], z: Layer.UIA})

  // json.z overrides ent.sprite.z.
  assert(parseTextXY({sprite}, {z: 'UIB'}), {chars: [], z: Layer.UIB})
})

test('parseWH()', () => {
  assert(parseWH(5), {w: 5, h: 5})
  assert(parseWH({w: 1}), {w: 1, h: 0})
  assert(parseWH({h: 2}), {w: 0, h: 2})
  assert(parseWH({w: 3, h: 4}), {w: 3, h: 4})
})

test('parseXY()', () => {
  assert(parseXY(5), {x: 5, y: 5})
  assert(parseXY({x: 1}), {x: 1, y: 0})
  assert(parseXY({y: 2}), {x: 0, y: 2})
  assert(parseXY({x: 3, y: 4}), {x: 3, y: 4})
})

function TestPools(): PoolMap {
  return {
    default: SpritePool({atlas, looper: {age: 0}, pageBlocks: 4}),
    secondary: SpritePool({atlas, looper: {age: 0}, pageBlocks: 4})
  }
}
