import {describe, test} from 'node:test'
import type {Button, Ent} from '../ents/ent.ts'
import type {Anim, AnyTag, Atlas} from '../graphics/atlas.ts'
import {Layer} from '../graphics/layer.ts'
import {drawableBytes, Sprite} from '../graphics/sprite.ts'
import {Pool} from '../mem/pool.ts'
import type {PoolMap} from '../mem/pool-map.ts'
import {assert} from '../test/assert.ts'
import type {Box} from '../types/geo.ts'
import {
  type ComponentHook,
  componentKeys,
  type EntSchema,
  type OrderByComponent,
  parseBorder,
  parseButton,
  parseEnt,
  parseEntComponent,
  parseFollowCam,
  parseFollowCursor,
  parseLevel,
  parseNinePatch,
  parseSprite,
  parseTextUI,
  parseWH,
  parseXY,
  type SpriteSchema
} from './level.ts'

declare module '../ents/ent.ts' {
  // biome-ignore lint/correctness/noUnusedVariables:;
  interface Ent<Tag extends AnyTag> {
    widget?: number
  }
}

declare module './level.ts' {
  // biome-ignore lint/correctness/noUnusedVariables:;
  interface EntSchema<Tag extends AnyTag> {
    widget?: {gears: number}
  }
}

declare module '../mem/pool-map.ts' {
  interface PoolMap<Tag extends AnyTag> {
    secondary: Pool<Sprite<Tag>>
  }
}

type Tag = 'stem--A' | 'stem--B'

const animA: Readonly<Anim> = {cels: 4, id: 0, w: 10, h: 20}

const atlas: Readonly<Atlas<Tag>> = {
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
  const btn = parseButton(
    {type: 'Toggle', pressed: {tag: 'stem--A'}, selected: 'stem--B'},
    pools
  )
  assert(btn.type, 'Toggle')
  assert(btn.pressed?.tag, 'stem--A')
  assert(btn.selected?.tag, 'stem--B')

  assert(parseButton({}, pools).type, 'Button')
})

test('parseEnt() with parseComponent override hook', () => {
  const pools = TestPools()
  const json: EntSchema<Tag> = {
    name: 'X',
    sprite: 'stem--A',
    widget: {gears: 5}
  }

  // no hook.
  let ent = parseEnt(json, pools, () => undefined)
  assert(ent.name, 'X')
  assert(ent.sprite?.tag, 'stem--A')
  assert((ent as {widget: number}).widget, undefined)

  // hook.
  ent = parseEnt(json, pools, (json, k) => {
    if (json[k] == null) return
    if (k === 'widget') return json[k].gears satisfies Ent<Tag>[typeof k]
  })
  assert(ent.name, 'X')
  assert(ent.sprite?.tag, 'stem--A')
  assert((ent as {widget: number}).widget, 5)
})

test('parseEnt() key order', () => {
  const pools = TestPools()
  const hook: ComponentHook<Tag> = (json, k) => {
    if (json[k] == null) return
    if (k === 'widget') return json[k].gears satisfies Ent<Tag>[typeof k]
  }

  const a: EntSchema<Tag> = {
    name: 'Name',
    id: '1',
    text: 'hello',
    button: {type: 'Toggle'},
    sprite: 'stem--A',
    ninePatch: {border: 1, patch: {}},
    followCam: {origin: 'N'},
    followCursor: {keyboard: 1, pick: 'stem--B'},
    widget: {gears: 3},
    textUI: {maxW: 100, origin: 'S', scale: 2}
  }
  assert(Object.keys(parseEnt(a, pools, hook)), [
    'id',
    'name',
    'sprite',
    'text',
    'button',
    'ninePatch',
    'followCam',
    'followCursor',
    'widget',
    'textUI'
  ])

  const b: EntSchema<Tag> = {
    widget: {gears: 3},
    text: 'first',
    sprite: 'stem--B',
    name: 'Second',
    id: '2',
    textUI: {origin: 'E'},
    button: {type: 'Button'}
  }
  assert(Object.keys(parseEnt(b, pools, hook)), [
    'id',
    'name',
    'sprite',
    'widget',
    'text',
    'textUI',
    'button'
  ])

  const c: EntSchema<Tag> = {name: 'name', id: '2'}
  assert(Object.keys(parseEnt(c, pools, hook)), ['id', 'name'])
})

test('parseEntComponent() routes fields', () => {
  const pools = TestPools()
  const json: EntSchema<Tag> = {
    id: '1',
    name: 'Name',
    text: 'text',
    sprite: 'stem--A',
    ninePatch: {border: 1, patch: {}},
    followCam: {margin: 2, origin: 'N'},
    followCursor: {keyboard: 1, pick: 'stem--B'},
    textUI: {maxW: 100, origin: 'S', scale: 2},
    button: {type: 'Toggle'}
  }

  assert(parseEntComponent(json, 'id', pools), '1')
  assert(parseEntComponent(json, 'name', pools), 'Name')
  assert(parseEntComponent(json, 'text', pools), 'text')
  assert(
    (parseEntComponent(json, 'sprite', pools) as Sprite<Tag>).tag,
    'stem--A'
  )
  assert(parseEntComponent(json, 'ninePatch', pools), {
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
  })
  assert(parseEntComponent(json, 'followCam', pools), {
    fill: undefined,
    margin: {n: 2, s: 2, w: 2, e: 2},
    modulo: {x: 0, y: 0},
    origin: 'N'
  })
  assert(parseEntComponent(json, 'followCursor', pools), {
    keyboard: 1,
    pick: 'stem--B'
  })
  assert(parseEntComponent(json, 'textUI', pools), {
    maxW: 100,
    origin: 'S',
    scale: 2
  })
  assert(
    (parseEntComponent(json, 'button', pools) as Button<Tag>).type,
    'Toggle'
  )

  assert(
    parseEntComponent({}, 'missing' as keyof EntSchema<Tag>, pools),
    undefined
  )
})

test('parseFollowCam()', () => {
  assert(parseFollowCam({origin: 'Center'}), {
    fill: undefined,
    margin: {n: 0, s: 0, w: 0, e: 0},
    modulo: {x: 0, y: 0},
    origin: 'Center'
  })

  assert(parseFollowCam({fill: 'XY', margin: 3, modulo: 5, origin: 'NE'}), {
    fill: 'XY',
    margin: {n: 3, s: 3, w: 3, e: 3},
    modulo: {x: 5, y: 5},
    origin: 'NE'
  })

  assert(parseFollowCam({margin: {w: 1}, modulo: {y: 2}, origin: 'S'}), {
    fill: undefined,
    margin: {n: 0, s: 0, w: 1, e: 0},
    modulo: {x: 0, y: 2},
    origin: 'S'
  })

  assert(parseFollowCam({margin: {y: 1}, modulo: {}, origin: 'S'}), {
    fill: undefined,
    margin: {n: 1, s: 1, w: 0, e: 0},
    modulo: {x: 0, y: 0},
    origin: 'S'
  })
})

test('parseFollowCursor()', () => {
  assert(parseFollowCursor({}), {
    keyboard: 0,
    pick: undefined
  })
  assert(parseFollowCursor({keyboard: 2, pick: 'stem--B'}), {
    keyboard: 2,
    pick: 'stem--B'
  })
})

test('parseLevel() aggregates ents and defaults', () => {
  const pools = TestPools()
  const lvl = parseLevel(
    {
      keepZoo: true,
      ents: [
        {id: 'a', sprite: 'stem--A'},
        {id: 'b', text: 'hello'}
      ],
      minWH: {w: 3}
    },
    pools,
    () => undefined
  )
  assert(lvl.ents.length, 2)
  assert(lvl.keepZoo, true)
  assert(lvl.minWH, {w: 3, h: 0})
  assert(lvl.ents[0]?.sprite?.tag, 'stem--A')
  assert(lvl.ents[1]?.text, 'hello')

  const emptyLvl = parseLevel({}, pools, () => undefined)
  assert(emptyLvl, {
    ents: [],
    keepZoo: false,
    minWH: {w: Infinity, h: Infinity}
  })
})

test('parseNinePatch()', () => {
  const pools = TestPools()

  // number border and margin.
  const nineA = parseNinePatch(
    {
      border: 2,
      pad: 3,
      patch: {center: {tag: 'stem--A'}, n: {tag: 'stem--B'}}
    },
    pools
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

  // object border and margin.
  const nineC = parseNinePatch(
    {
      border: {n: 1, s: 2, w: 3, e: 4},
      pad: {w: 7},
      patch: {nw: 'stem--A', se: 'stem--B'}
    },
    pools
  )
  assert(nineC.border, {n: 1, s: 2, w: 3, e: 4})
  assert(nineC.pad, {n: 0, s: 0, w: 7, e: 0})
  assert(nineC.patch.nw?.tag, 'stem--A')
  assert(nineC.patch.se?.tag, 'stem--B')
})

describe('parseSprite()', () => {
  test('tag', () => {
    const sprite = parseSprite('stem--A', TestPools())
    assert(sprite.tag, 'stem--A')
    assert(sprite.w, animA.w)
    assert(sprite.h, animA.h)
  })

  test('object', () => {
    const json: Required<SpriteSchema<Tag>> & Box & {scale: number} = {
      flip: 'XY',
      pool: 'Default',
      stretch: true,
      tag: 'stem--B',
      z: 'UIA',
      zend: true,
      x: 5,
      y: 6,
      w: 7,
      h: 8,
      scale: 2
    }
    const sprite = parseSprite(json, TestPools())
    assert(sprite.tag, 'stem--B')
    assert(sprite.flipX, true)
    assert(sprite.flipY, true)
    assert(sprite.stretch, true)
    assert(sprite.x, 5)
    assert(sprite.y, 6)
    assert(sprite.w, 7 * 2)
    assert(sprite.h, 8 * 2)
    assert(sprite.z, Layer.UIA)
    assert(sprite.zend, true)
  })

  test('nondefault pool', () => {
    const sprite = parseSprite({pool: 'Secondary', tag: 'stem--A'}, TestPools())
    assert(sprite.tag, 'stem--A')
  })

  test('missing pool', () =>
    assert.throws(
      () => parseSprite({pool: 'Missing', tag: 'stem--A'}, TestPools()),
      /no missing sprite pool/
    ))
})

test('parseTextUI()', () => {
  assert(parseTextUI({}), {maxW: 4095, origin: 'Center', scale: 1})
  assert(parseTextUI({maxW: 100, origin: 'N', scale: 2}), {
    maxW: 100,
    origin: 'N',
    scale: 2
  })
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

test('componentKeys() sort by priority', () => {
  const json: EntSchema<Tag> = {
    name: 'Name',
    id: '1',
    text: 'hello',
    button: {type: 'Button'},
    sprite: 'stem--A',
    textUI: {origin: 'S'}
  }
  const order: OrderByComponent = {
    sprite: 0,
    name: 10,
    id: 20,
    text: 30,
    button: 40,
    textUI: 50
  }
  const keys = componentKeys(json, order)
  assert(keys, ['sprite', 'name', 'id', 'text', 'button', 'textUI'])
})

test('componentKeys() default to insertion order', () => {
  const json: EntSchema<Tag> = {
    text: 't',
    name: 'n',
    id: 'i',
    sprite: 'stem--A',
    button: {type: 'Button'}
  }

  const keys1 = componentKeys(json, {})
  assert(keys1, ['text', 'name', 'id', 'sprite', 'button'])

  // equal priorities preserve insertion order.
  const keys2 = componentKeys(json, {
    text: 1,
    name: 1,
    id: 1,
    sprite: 1,
    button: 1
  })
  assert(keys2, ['text', 'name', 'id', 'sprite', 'button'])
})

function TestPools(): PoolMap<Tag> {
  return {default: TestPool(), secondary: TestPool()}
}

function TestPool(): Pool<Sprite<Tag>> {
  return new Pool({
    alloc: pool => new Sprite(pool, 0, atlas, {age: 0}),
    init: block => block.init(),
    allocBytes: drawableBytes,
    pageBlocks: 4
  })
}
