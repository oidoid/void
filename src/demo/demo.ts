import {
  Cam,
  type DefaultButton,
  DefaultInput,
  debug,
  drawableBytes,
  Framer,
  fetchImage,
  initDoc,
  Layer,
  Pool,
  Renderer,
  Sprite,
  type Void,
  version
} from '../index.ts'
import atlas from './atlas.json' with {type: 'json'}

declare global {
  var v: Void<DefaultButton, Tag>
}

declare module '../index.ts' {
  interface Debug {
    /** always render. */
    invalid?: string
  }
}

type Tag = keyof typeof atlas.anim

console.log(`void v${version} ───oidoid>°──`)

const canvas = initDoc(0xffffb1ff, 'Int')

// to-do: center cam on background.
const cam = new Cam()
cam.minWH = {w: 320, h: 240} // to-do: support zoom out.

const input = DefaultInput(cam, canvas)
input.register('add')

const renderer = new Renderer(atlas, canvas)
renderer.register('add')
const framer = new Framer()

const spritePool = new Pool<Sprite<Tag>>({
  alloc: pool => new Sprite(pool, 0, atlas, framer),
  allocBytes: drawableBytes,
  minPages: 3,
  pageBlocks: 10_000
})

globalThis.v = {cam, canvas, debug, framer, pool: spritePool, input, renderer}

const cursor = spritePool.alloc()
cursor.tag = 'cursor--Pointer'
cursor.z = Layer.Hidden

;(async () => {
  renderer.load(await fetchImage('/atlas.png'))
})()

const bg = spritePool.alloc()
bg.tag = 'background--OrangeCheckerboard'
bg.w = 320
bg.h = 240
bg.z = Layer.Bottom
// to-do: 9patch for borders.

const filterPool = new Pool<Sprite<Tag>>({
  alloc: pool => new Sprite(pool, 0, atlas, framer),
  allocBytes: drawableBytes,
  pageBlocks: 10
})
const filter = filterPool.alloc()
filter.tag = 'background--GreyCheckerboard'
filter.w = 4095
filter.h = 4095
filter.z = Layer.UIBottom

framer.onFrame = millis => {
  input.update(millis)
  cam.update(canvas)

  const epsilon = 1 / 8 //to-do:1/16 and move to sprite or something.
  if (input.isAnyOnStart('L', 'R', 'U', 'D')) {
    cam.x = Math.trunc(cam.x)
    cam.y = Math.trunc(cam.y)
  }
  if (input.isOn('L')) cam.x -= epsilon
  if (input.isOn('R')) cam.x += epsilon
  if (input.isOn('U')) cam.y -= epsilon
  if (input.isOn('D')) cam.y += epsilon

  if (input.point?.started) {
    cursor.x = input.point.local.x
    cursor.y = input.point.local.y
    cursor.z = Layer.UITop
  }

  if (!debug?.invalid && !input.invalid && !cam.invalid && !renderer.invalid)
    return
  if (debug?.input) printInput()

  renderer.clear(0xffffb1ff)
  renderer.prerender(cam, framer)
  renderer.setDepth(true)
  renderer.render(spritePool)
  renderer.setDepth(false)
  renderer.render(filterPool)
}
framer.register('add')

function printInput(): void {
  if (input.started) {
    const on = !!input.on.length
    if (on) console.debug(`[input] buttons on: ${input.on.join(' ')}`)
    else console.debug(`[input] buttons off`)
    const combo = input.combo
    if (combo.length > 1 && on)
      console.debug(
        `[input] combo: ${combo.map(set => set.join('+')).join(' ')}`
      )
  }
  if (input.point?.started && input.point?.click && !input.point.pinch)
    console.debug(
      `[input] ${input.point.drag.on ? 'drag' : 'click'} xy: ${input.point.xy.x} ${input.point.xy.y}`
    )
  if (input.point?.pinch)
    console.debug(
      `[input] pinch xy: ${input.point.pinch.xy.x} ${input.point.pinch.xy.y}`
    )
  if (input.wheel)
    console.debug(
      `[input] wheel xy: ${input.wheel.delta.xy.x} ${input.wheel.delta.xy.y}`
    )
}
