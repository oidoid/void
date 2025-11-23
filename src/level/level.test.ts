import {describe, test} from 'node:test'
import type {Button, Ent} from '../ents/ent.ts'
import type {Anim, Atlas, TagFormat} from '../graphics/atlas.ts'
import {Layer} from '../graphics/layer.ts'
import {drawableBytes, Sprite} from '../graphics/sprite.ts'
import {Pool} from '../mem/pool.ts'
import type {PoolMap} from '../mem/pool-map.ts'
import {assert} from '../test/assert.ts'
import type {Box} from '../types/geo.ts'
import {
  type EntSchema,
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
} from './level-file.ts'

declare module '../ents/ent.ts' {
  // biome-ignore lint/correctness/noUnusedVariables:;
  interface Ent<Tag extends TagFormat> {
    widget?: number
  }
}

declare module './level-file.ts' {
  // biome-ignore lint/correctness/noUnusedVariables:;
  interface EntSchema<Tag extends TagFormat> {
    widget?: {gears: number}
  }
}

declare module '../mem/pool-map.ts' {
  interface PoolMap<Tag extends TagFormat> {
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
  ent = parseEnt(json, pools, (json, _pools, k) => {
    if (json[k] == null) return
    if (k === 'widget') return json[k].gears satisfies Ent<Tag>[typeof k]
  })
  assert(ent.name, 'X')
  assert(ent.sprite?.tag, 'stem--A')
  assert((ent as {widget: number}).widget, 5)
})

test('parseEntComponent() routes fields', () => {
  const pools = TestPools()
  const json: EntSchema<Tag> = {
    id: '1',
    name: 'Name',
    text: 'text',
    sprite: 'stem--A',
    ninePatch: {border: 1, patch: {}},
    followCam: {dir: 'N', margin: 2},
    followCursor: {keyboard: 1, pick: 'stem--B'},
    textUI: {dir: 'S', maxW: 100, scale: 2},
    button: {type: 'Toggle'}
  }

  assert(parseEntComponent(json, pools, 'id'), '1')
  assert(parseEntComponent(json, pools, 'name'), 'Name')
  assert(parseEntComponent(json, pools, 'text'), 'text')
  assert(
    (parseEntComponent(json, pools, 'sprite') as Sprite<Tag>).tag,
    'stem--A'
  )
  assert(parseEntComponent(json, pools, 'ninePatch'), {
    border: {n: 1, s: 1, w: 1, e: 1},
    margin: {w: 0, h: 0},
    patch: {
      origin: undefined,
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
  assert(parseEntComponent(json, pools, 'followCam'), {
    dir: 'N',
    fill: undefined,
    margin: {w: 2, h: 2},
    modulo: {x: 0, y: 0}
  })
  assert(parseEntComponent(json, pools, 'followCursor'), {
    keyboard: 1,
    pick: 'stem--B'
  })
  assert(parseEntComponent(json, pools, 'textUI'), {
    dir: 'S',
    maxW: 100,
    scale: 2
  })
  assert(
    (parseEntComponent(json, pools, 'button') as Button<Tag>).type,
    'Toggle'
  )

  assert(
    parseEntComponent({}, pools, 'missing' as keyof EntSchema<Tag>),
    undefined
  )
})

test('parseFollowCam()', () => {
  assert(parseFollowCam({dir: 'Origin'}), {
    dir: 'Origin',
    fill: undefined,
    margin: {w: 0, h: 0},
    modulo: {x: 0, y: 0}
  })

  assert(parseFollowCam({dir: 'NE', fill: 'XY', margin: 3, modulo: 5}), {
    dir: 'NE',
    fill: 'XY',
    margin: {w: 3, h: 3},
    modulo: {x: 5, y: 5}
  })

  assert(parseFollowCam({dir: 'S', margin: {w: 1}, modulo: {y: 2}}), {
    dir: 'S',
    fill: undefined,
    margin: {w: 1, h: 0},
    modulo: {x: 0, y: 2}
  })
})

test('parseFollowCursor()', () => {
  assert(parseFollowCursor({}), {keyboard: 0, pick: undefined})
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
      margin: 3,
      patch: {origin: {tag: 'stem--A'}, n: {tag: 'stem--B'}}
    },
    pools
  )
  assert(nineA.border, {n: 2, s: 2, w: 2, e: 2})
  assert(nineA.margin, {w: 3, h: 3})
  assert(nineA.patch.origin?.tag, 'stem--A')
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
      margin: {w: 7},
      patch: {nw: 'stem--A', se: 'stem--B'}
    },
    pools
  )
  assert(nineC.border, {n: 1, s: 2, w: 3, e: 4})
  assert(nineC.margin, {w: 7, h: 0})
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
  assert(parseTextUI({}), {dir: 'Origin', maxW: 4095, scale: 1})
  assert(parseTextUI({dir: 'N', maxW: 100, scale: 2}), {
    dir: 'N',
    maxW: 100,
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
