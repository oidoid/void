import {published, version} from '../../package.json'
import {Cam} from '../cam.ts'
import {Framer} from '../framer.ts'
import {Layer} from '../graphics/layer.ts'
import {Renderer} from '../graphics/renderer.ts'
import {drawableBytes, Sprite} from '../graphics/sprite.ts'
import {DefaultInput} from '../input/input.ts'
import {Pool} from '../mem/pool.ts'
import {debug} from '../types/debug.ts'
import {fetchImage} from '../utils/fetch-util.ts'
import atlas from './atlas.json' with {type: 'json'}

declare module '../types/debug.ts' {
  interface Debug {
    /** always render. */
    invalid?: string
  }
}

type Tag = keyof typeof atlas.anim

console.log(`void v${version}+${published} ───oidoid>°──`)

const canvas = document.querySelector('canvas')
if (!canvas) throw Error('no canvas')
canvas.style.imageRendering = 'pixelated' // why doesn't cam mode set this?
canvas.style.display = 'block'
canvas.style.touchAction = 'none' // to-do: normal html stuff.
canvas.tabIndex = 0
canvas.style.outline = 'none' // disable focus outline.
canvas.style.cursor = 'none'
canvas.focus()
// to-do: the rest

// to-do: center cam on background.
const cam = new Cam()
cam.mode = 'Int'
cam.minWH = {w: 320, h: 240} // to-do: support zoom out.

const input = DefaultInput(cam, canvas)
input.register('add')

const renderer = new Renderer(atlas, canvas)
const framer = new Framer()

const pool = new Pool<Sprite<Tag>>({
  alloc: pool => new Sprite(pool, 0, atlas, framer),
  allocBytes: drawableBytes,
  minPages: 3,
  pageBlocks: 10_000
})

globalThis.v = {cam, debug, framer, pool, input, renderer}

const cursor = pool.alloc()
cursor.tag = 'cursor--Pointer'
cursor.z = Layer.UITop

;(async () => {
  renderer.load(await fetchImage('/atlas.png'))
})()

const bg = pool.alloc()
bg.tag = 'background--Checkerboard'
bg.w = 320
bg.h = 240
bg.z = Layer.UIBottom
const bg2 = pool.alloc()
bg2.tag = 'background--Checkerboard'
bg2.w = 320
bg2.h = 240
bg2.z = Layer.Bottom
// to-do: 9patch for borders.

framer.onFrame = millis => {
  input.update(millis)
  cam.update(canvas)

  if (input.point?.started) {
    cursor.x = input.point.local.x
    cursor.y = input.point.local.y
  }
  const epsilon = 1 / 8 //to-do:1/16 and move to sprite or something.
  if (input.isOn('L')) cam.x -= epsilon
  if (input.isOn('R')) cam.x += epsilon
  if (input.isOn('U')) cam.y -= epsilon
  if (input.isOn('D')) cam.y += epsilon

  if (!debug?.invalid && !input.invalid && !cam.invalid && !renderer.invalid)
    return
  if (debug?.input) printInput()
  renderer.clear(0xffffb1ff)
  renderer.render(cam, framer, pool)
}
framer.register('add')

function printInput(): void {
  if (input.started) {
    const on = !!input.on.length
    if (on) console.debug(`buttons on: ${input.on.join(' ')}`)
    else console.debug(`buttons off`)
    const combo = input.combo
    if (combo.length > 1 && on)
      console.debug(`combo: ${combo.map(set => set.join('+')).join(' ')}`)
  }
  if (input.point?.started && input.point?.click && !input.point.pinch)
    console.debug(
      `${input.point.drag.on ? 'drag' : 'click'} xy: ${input.point.xy.x} ${input.point.xy.y}`
    )
  if (input.point?.pinch)
    console.debug(
      `pinch xy: ${input.point.pinch.xy.x} ${input.point.pinch.xy.y}`
    )
  if (input.wheel)
    console.debug(
      `wheel xy: ${input.wheel.delta.xy.x} ${input.wheel.delta.xy.y}`
    )
}
