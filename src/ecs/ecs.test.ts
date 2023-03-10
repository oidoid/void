import { Int, NumXY, U8XY } from '@/ooz'
import { ECS, parseQuerySet, System } from '@/void'
import { assertEquals } from 'std/testing/asserts.ts'
import { RunState } from './run-state.ts'

class Sprite {
  constructor(public img: string) {}
}

interface Ent {
  hidden: true
  sprite: Sprite
  sprites: [Sprite, ...Sprite[]]
  text: string
}

for (
  const [index, [queryStr, query]] of ([
    ['name', [new Set(['name'] as const)]],
    ['name & position', [new Set(['name', 'position'] as const)]],
    ['wh & items', [new Set(['items', 'wh'] as const)]],
    ['name & position | bags', [
      new Set(['bags' as const]),
      new Set(['name', 'position'] as const),
    ]],
    ['name & !position | bags', [
      new Set(['bags' as const]),
      new Set(['name', '!position'] as const),
    ]],
  ] as const).entries()
) {
  Deno.test(`Parse query: ${index}.`, () => {
    interface Ent {
      readonly name: string
      readonly position: NumXY
      readonly bags: Int
      readonly wh: U8XY
      readonly items: string[]
    }
    assertEquals(parseQuerySet<Ent>(queryStr), query)
  })
}

Deno.test('ECS processes system in push order.', () => {
  const ecs = new ECS<Ent>()
  const order: string[] = []
  ecs.addSystem(
    { query: '', run: () => order.push('A') },
    { query: '', run: () => order.push('B') },
    { query: '', run: () => order.push('C') },
  )
  ecs.run({ ecs } as RunState<Ent>)
  assertEquals(order, ['A', 'B', 'C'])
})

Deno.test('ECS processes system in shift order.', () => {
  const ecs = new ECS<Ent>()
  const order: string[] = []
  ecs.insertSystem(0, { query: '', run: () => order.push('A') })
  ecs.insertSystem(0, { query: '', run: () => order.push('B') })
  ecs.insertSystem(0, { query: '', run: () => order.push('C') })
  ecs.run({ ecs } as RunState<Ent>)
  assertEquals(order, ['C', 'B', 'A'])
})

Deno.test('Ent additions are patched.', () => {
  const ecs = new ECS<Ent>()
  const sys = ecs.addSystem({
    ents: [] as { readonly text: string }[],
    query: 'text',
    run(ents: ReadonlySet<{ readonly text: string }>) {
      this.ents = [...ents] // Make a copy.
    },
  })
  ecs.addEnt({ text: 'abc' })
  ecs.run({ ecs } as RunState<Ent>)
  assertEquals(sys.ents, [])
  ecs.run({ ecs } as RunState<Ent>)
  assertEquals(sys.ents, [{ text: 'abc' }])
})

Deno.test('Ents are queryable.', () => {
  const ecs = new ECS<Ent>()

  const [a, b, c, d, e] = ecs.addEnt(
    { text: 'a' },
    { sprite: new Sprite('B') },
    { sprite: new Sprite('C'), text: 'c' },
    { sprite: new Sprite('D'), hidden: true as const, text: 'd' },
    { text: 'e' },
  )

  assertEquals([...ecs.query('text')], [])
  ecs.patch()

  assertEquals([...ecs.query('text')], [a, c, d, e])
  assertEquals([...ecs.query('sprite')], [b, c, d])
  assertEquals([...ecs.query('text & sprite')], [c, d])
  assertEquals([...ecs.query('text & sprite & !hidden')], [c])
  assertEquals([...ecs.query('sprite & hidden | sprite & text')], [c, d])
})

Deno.test('Systems can have state.', () => {
  type ConsoleEnt =
    | Readonly<{ sprite: Sprite; text: string }>
    | Readonly<{ sprites: [Sprite, ...Sprite[]]; text: string }>

  class Sys implements System<ConsoleEnt> {
    readonly query = 'sprite & text & !hidden | sprites & text & !hidden'
    #str = ''

    run(ents: ReadonlySet<Readonly<ConsoleEnt>>): void {
      this.#str = ''
      for (const ent of ents) {
        const sprite = 'sprite' in ent ? ent.sprite : ent.sprites[0]
        this.#str += `${sprite.img}: ${ent.text} `
      }
    }

    get str(): string {
      return this.#str
    }
  }
  const ecs = new ECS<Ent>()
  const sys = ecs.addSystem(new Sys())
  ecs.addEnt(
    { sprite: new Sprite('A'), text: 'a', hidden: true },
    { sprite: new Sprite('B'), text: 'b' },
  )
  ecs.run({ ecs } as RunState<Ent>)
  assertEquals(sys.str, '')
  ecs.run({ ecs } as RunState<Ent>)
  assertEquals(sys.str, 'B: b ')
})
