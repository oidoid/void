import {
  ButtonEnt,
  Cam,
  CursorEnt,
  type DefaultButton,
  DefaultInput,
  debug,
  drawableBytes,
  FollowCamEnt,
  Framer,
  fetchImage,
  type Input,
  initDoc,
  Layer,
  Pool,
  parseAtlas,
  Renderer,
  Sprite,
  spriteMaxWH,
  type Void,
  version,
  Zoo
} from '../index.ts'
import atlasJSON from './atlas.json' with {type: 'json'}
import {ClockEnt} from './ents/clock-ent.ts'
import type {Tag} from './tag.ts'

declare global {
  var v: Void
}

declare module '../index.ts' {
  interface Debug {
    /** always render. */
    invalid?: string
    /** update the clock at least once a second instead of once a minute. */
    seconds?: string
  }

  interface Void {
    input: Input<DefaultButton>
    pool: Pool<Sprite<Tag>>
    zoo: Zoo<Tag>
  }
}

console.debug(`void v${version} ───oidoid>°──`)

const canvas = initDoc(0xffffb1ff, 'Int')

// to-do: center cam on background.
const cam = new Cam()
cam.minWH = {w: 320, h: 240} // to-do: support zoom out.

const framer = new Framer()

const input = DefaultInput(cam, canvas)
input.register('add')
input.onEvent = () => framer.requestFrame()

const atlas = parseAtlas(atlasJSON)

const renderer = new Renderer(atlas, canvas)
renderer.register('add')

const spritePool = new Pool<Sprite<Tag>>({
  alloc: pool => new Sprite(pool, 0, atlas, framer),
  allocBytes: drawableBytes,
  minPages: 3,
  pageBlocks: 10_000
})
const zoo = new Zoo<Tag>()

globalThis.v = {
  cam,
  canvas,
  debug,
  framer,
  pool: spritePool,
  input,
  renderer,
  zoo
}

;(async () => {
  renderer.load(await fetchImage('/atlas.png'))
  framer.requestFrame()
  startTimer()
})()

function startTimer(): void {
  const now = new Date()
  const delay =
    (debug?.seconds ? 0 : (59 - (now.getSeconds() % 60)) * 1000) +
    1000 -
    (now.getMilliseconds() % 1000)
  setTimeout(() => {
    framer.requestFrame()
    setInterval(() => framer.requestFrame(), (debug?.seconds ? 1 : 60) * 1000)
  }, delay)
}

// to-do: mobile is running in invalid mode

// need to not consider gamepad connected as invalid because this will always render, want always poll not always render in that case. need to propagate connected event.
// to-do: why don't I get click combo for touchpad taps?
// to-do: gamepad connected listeren

// Create a ResizeObserver
const resizeObserver = new ResizeObserver(() => {
  console.log('parent resized')
  framer.requestFrame()
})

if (!canvas.parentElement) throw Error('canvas has no parent')
resizeObserver.observe(canvas.parentElement)
// to-do: unobserve / disconnect().

const bg = new FollowCamEnt(v, 'background--OrangeCheckerboard', 'Origin')
bg.w = 320
bg.h = 240
bg.z = Layer.Bottom

// to-do: 9patch for borders.

const abc123 = spritePool.alloc()
abc123.tag = 'abc123--ABC'
abc123.cel = 10
abc123.x = 200
abc123.y = 100
abc123.z = Layer.A
abc123.stretch = true
abc123.w *= 3
abc123.h *= 3

const backpacker = spritePool.alloc()
backpacker.tag = 'backpacker--WalkRight'
backpacker.x = 7
backpacker.y = 7
backpacker.z = Layer.C
backpacker.stretch = true
backpacker.w *= 5
backpacker.h *= 5

// to-do: this is invalid. I really don't want folks wirintg this.
// ninep.xy.y = 300


const invalidateToggle = new ButtonEnt(v, {
  w: {tag: 'background--Strawberry'},
  nw: {tag: 'background--Cyan'},
  n: {tag: 'background--Bubblegum'},
  ne: {tag: 'background--Cucumber'},
  e: {tag: 'background--Blueberry'},
  s: {tag: 'background--Kiwi'},
  se: {tag: 'background--Mustard'},
  sw: {tag: 'background--Squash'},
  origin: {tag: 'background--Grape'},
  border: {n: 1},

  pressed: 'background--OrangeCheckerboard',
  selected: 'background--OrangeCheckerboard',
  toggle: true,
  text: 'invalidate',
  textScale: 2,
  wh: {w: 120, h: 30},
  x: 50,
  y: 65,
  z: Layer.UIC
})

// had smoe really nifty JSON defautls before.

zoo.add(
  // always update the cursor first so that other ents may depend on its
  // position instead of input.
  new CursorEnt(v, 'cursor--Pointer'),

  bg,

  // take XY in constructor?
  new ClockEnt(),
  invalidateToggle
)

const filterPool = new Pool<Sprite<Tag>>({
  alloc: pool => new Sprite(pool, 0, atlas, framer),
  allocBytes: drawableBytes,
  pageBlocks: 10
})
const filter = filterPool.alloc()
filter.tag = 'background--GreyCheckerboard'
filter.w = spriteMaxWH.w
filter.h = spriteMaxWH.h
filter.z = Layer.UIA

framer.onFrame = millis => {
  if (document.hidden) return
  input.update(millis)
  cam.update(canvas)

  const epsilon = 1 / 4 // 1 / 64 //to-do:1/16 and move to sprite or something.
  if (input.isAnyOnStart('L', 'R', 'U', 'D')) {
    cam.x = Math.trunc(cam.x)
    cam.y = Math.trunc(cam.y)
  }
  if (input.isOn('L')) cam.x -= epsilon
  if (input.isOn('R')) cam.x += epsilon
  if (input.isOn('U')) cam.y -= epsilon
  if (input.isOn('D')) cam.y += epsilon

  // if (input.wheel?.delta.xy.y)
  //   cam.zoomOut += Math.max(0, Math.sign(input.wheel.delta.xy.y)) // fixme

  let updated = zoo.update(v)

  if (abc123.looped) {
    abc123.tag = abc123.tag === 'abc123--123' ? 'abc123--ABC' : 'abc123--123'
    abc123.w *= 3
    abc123.h *= 3 // not a good option here? surprising not to change size, surprising to.
    updated = true
  }
  if (debug?.input) printInput()

  const render = updated || debug?.invalid || cam.invalid || renderer.invalid
  if (render) {
    renderer.clear(0xffffb1ff)
    renderer.prerender(cam, framer)
    renderer.setDepth(true)
    renderer.render(spritePool)
    renderer.setDepth(false)
    renderer.render(filterPool)
  }

  if (input.anyOn || input.gamepad || debug?.invalid) framer.requestFrame()
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
  if (input.point?.invalid && input.point?.click && !input.point.pinch)
    console.debug(
      `[input] ${input.point.drag.on ? 'drag' : 'click'} xy: ${input.point.x} ${input.point.y}`
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
