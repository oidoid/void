#!/usr/bin/env node
import {Argv} from '../../tools/utils/argv.ts'
import type {Atlas, Tag} from '../graphics/atlas.ts'
import type {Sprite} from '../graphics/sprite.ts'
import {Grid} from '../grid/grid.ts'
import {SpritePool} from '../mem/sprite-pool.ts'
import {Random} from '../random/random.ts'
import type {XY} from '../types/geo.ts'
import type {Millis} from '../types/time.ts'

// to-do: compile for browser usage.

/** add `node --cpu-prof` as wanted. */
type Opts = {
  /** number of entities. */
  '--ent-count'?: string
  /** ent w/h. */
  '--ent-size'?: string
  /** test iterations. */
  '--loops'?: string
  /** world w/h. */
  '--world-size'?: string
  /** cell w/h. */
  '--cell-size'?: string
}

type HarnessFactory = {name: string; make(): Harness}
type Harness = {init(): void; deinit(): void; alloc(): Ent}
type Result = {test: string; avg: Millis; median: Millis; sink: number}

const argv: Readonly<Argv<Opts>> | undefined = globalThis.process
  ? Argv(process.argv)
  : undefined
const loops: number = Number(argv?.opts['--loops'] || 10_000)
const cellSize: number = Number(argv?.opts['--cell-size'] || 96)
const worldSize: number = Number(argv?.opts['--world-size'] || 32_768)
const entSize: number = Number(argv?.opts['--ent-size'] || 96)
const entCount: number = Number(argv?.opts['--ent-count'] || 100_000)

const testTag: Tag = 'superball--Default'

const atlas: Readonly<Atlas> = {
  anim: {
    [testTag]: {
      cels: 1,
      id: 0,
      w: entSize,
      h: entSize,
      hitbox: {x: 0, y: 0, w: entSize, h: entSize},
      hurtbox: {x: 0, y: 0, w: entSize, h: entSize}
    }
  },
  tags: [testTag],
  celXYWH: []
}

function fmtTime(millis: Millis): string {
  if (millis >= 1000) return `${(millis / 1000).toFixed(3)}s`
  if (millis >= 1) return `${millis.toFixed(3)}ms`
  if (millis >= 0.001) return `${(millis * 1000).toFixed(3)}µs`
  return `${(millis * 1_000_000).toFixed(3)}ns`
}

function loop(name: string, test: () => number): Result {
  let sink = 0
  const times = new Array(loops)
  for (let i = 0; i < loops; i++) {
    const t0 = performance.now()
    sink ^= test()
    times[i] = performance.now() - t0
  }
  times.sort((a, b) => a - b)
  const avg = (times.reduce((sum, t) => sum + t, 0) / loops) as Millis
  const median = times[Math.floor(loops / 2)]! as Millis
  return {test: name, avg, median, sink}
}

class SpritePoolHarness implements Harness {
  #pool!: SpritePool

  init(): void {
    this.#pool = SpritePool({
      atlas,
      looper: {age: 0 as Millis},
      pageBlocks: 1024
    })
  }

  deinit(): void {
    this.#pool.clear()
  }

  alloc(): Ent {
    const sprite = this.#pool.alloc()
    sprite.tag = testTag
    return {sprite, speed: {x: 0, y: 0}}
  }
}

type Ent = {sprite: Sprite; speed: XY}

function alloc(harness: Harness, entCount: number, seed: number): Ent[] {
  const rnd = new Random(seed)
  const ents: Ent[] = new Array(entCount)
  for (let i = 0; i < entCount; i++) {
    const ent = harness.alloc()
    const x = rnd.num * (worldSize - entSize)
    const y = rnd.num * (worldSize - entSize)
    ent.sprite.x = x
    ent.sprite.y = y
    const speed = 50 + rnd.num * 200
    const angle = rnd.num * Math.PI * 2
    ent.speed.x = Math.cos(angle) * speed
    ent.speed.y = Math.sin(angle) * speed
    ents[i] = ent
  }
  return ents
}

function move(ents: Ent[]): number {
  const tick = 1 / 60
  let sink = 0
  for (const ent of ents) {
    let dx = ent.speed.x * tick
    let dy = ent.speed.y * tick
    let nx = ent.sprite.x + dx
    let ny = ent.sprite.y + dy

    // wall bounce.
    if (nx < 0) {
      nx = 0
      ent.speed.x = Math.abs(ent.speed.x)
      dx = nx - ent.sprite.x
    } else if (nx > worldSize - entSize) {
      nx = worldSize - entSize
      ent.speed.x = -Math.abs(ent.speed.x)
      dx = nx - ent.sprite.x
    }
    if (ny < 0) {
      ny = 0
      ent.speed.y = Math.abs(ent.speed.y)
      dy = ny - ent.sprite.y
    } else if (ny > worldSize - entSize) {
      ny = worldSize - entSize
      ent.speed.y = -Math.abs(ent.speed.y)
      dy = ny - ent.sprite.y
    }

    ent.sprite.x += dx
    ent.sprite.y += dy
    sink ^= (nx | 0) ^ (ny | 0)
  }
  return sink
}

function collide(ents: readonly Ent[], grid: Grid<Ent>): number {
  let collisions = 0

  grid.clear()
  grid.init(ents)

  for (const [a, b] of grid.hit()) {
    collisions++

    // collide and swap velocities.
    const tvx = a.speed.x
    const tvy = a.speed.y
    a.speed.x = b.speed.x
    a.speed.y = b.speed.y
    b.speed.x = tvx
    b.speed.y = tvy

    // separate sprites.
    const overlapX = a.sprite.x + entSize - b.sprite.x
    const overlapY = a.sprite.y + entSize - b.sprite.y
    if (Math.abs(overlapX) < Math.abs(overlapY)) {
      const half = overlapX / 2
      a.sprite.x -= half
      b.sprite.x += half
    } else {
      const half = overlapY / 2
      a.sprite.y -= half
      b.sprite.y += half
    }
  }
  return collisions
}

export function test(factory: HarnessFactory): void {
  const worldBox = {
    x: -worldSize / 2,
    y: -worldSize / 2,
    w: worldSize,
    h: worldSize
  }
  const t0 = performance.now()
  const results: Result[] = []
  const harness = factory.make()

  {
    const result = loop('init', () => {
      harness.init()
      return 1
    })
    harness.deinit()
    results.push(result)
  }

  {
    harness.init()
    const result = loop('alloc', () => {
      const ents = alloc(harness, entCount, 1)
      let sink = ents.length
      for (const ent of ents) sink ^= (ent.sprite.x | 0) ^ (ent.speed.x | 0)
      harness.deinit()
      return sink
    })
    results.push(result)
  }

  {
    const harness = factory.make()
    harness.init()
    const ents = alloc(harness, entCount, 2)
    const result = loop('move', () => move(ents))
    harness.deinit()
    results.push(result)
  }

  {
    const harness = factory.make()
    harness.init()
    const ents = alloc(harness, entCount, 3)
    const grid = new Grid<Ent>(worldBox, cellSize, entSize)
    const result = loop('collide', () => collide(ents, grid))
    harness.deinit()
    results.push(result)
  }

  console.log(
    `${worldSize}×${worldSize} world with ${cellSize}×${cellSize} cells and ${entCount} ${entSize}×${entSize} ents over ${loops} iterations.`
  )
  console.log(factory.name)
  console.log(
    `${'test'.padEnd(12)}  ${'avg'.padStart(12)}  ${'median'.padStart(12)}`
  )
  for (const result of results)
    console.log(
      `${result.test.padEnd(12)}  ${fmtTime(result.avg).padStart(12)}  ${fmtTime(result.median).padStart(12)}`
    )
  console.log(fmtTime((performance.now() - t0) as Millis))
}

if (import.meta.main)
  test({name: 'SpritePool', make: () => new SpritePoolHarness()})
