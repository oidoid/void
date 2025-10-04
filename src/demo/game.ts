import * as V from '../index.ts'
import atlasJSON from './atlas.json' with {type: 'json'}
import {ClockEnt} from './ents/clock-ent.ts'
import {InvalidateToggleEnt} from './ents/invalidate-toggle-ent.ts'
import {WorkCounterEnt} from './ents/work-counter-ent.ts'
import type {Tag} from './tag.ts'

export class Game extends V.Void<Tag> {
  #abc123?: V.Sprite<Tag>
  #filterSprites: V.Pool<V.Sprite<Tag>>
  #interval: number = 0
  #timer: number = 0
  #invalidateToggle: InvalidateToggleEnt
  #workCounter: WorkCounterEnt

  constructor() {
    super({
      atlasImageURI: '/atlas.png',
      atlasJSON,
      backgroundRGBA: 0xffffb1ff,
      minWH: {w: 320, h: 240}
    })
    this.#filterSprites = new V.Pool<V.Sprite<Tag>>({
      alloc: pool => new V.Sprite(pool, 0, this.atlas, this.framer),
      allocBytes: V.drawableBytes,
      pageBlocks: 10
    })
    this.#invalidateToggle = new InvalidateToggleEnt(this)
    this.#workCounter = new WorkCounterEnt()
    this.#initZoo()
  }

  override async register(op: 'add' | 'remove'): Promise<void> {
    await super.register(op)
    if (op === 'add') {
      this.framer.requestFrame()
      this.#startTimer()
    } else {
      this.#stopTimer()
    }
  }

  override onLoop(_millis: V.Millis): void {
    let render = this.#updateCam()

    const updated = this.zoo.update(this)

    if (this.#abc123?.looped) {
      this.#abc123.tag =
        this.#abc123.tag === 'abc123--123' ? 'abc123--ABC' : 'abc123--123'
      this.#abc123.w *= 3
      this.#abc123.h *= 3
    }
    if (V.debug?.input) this.#printInput()

    render ||=
      updated ||
      !!V.debug?.invalid ||
      this.#invalidateToggle.on ||
      this.cam.invalid ||
      this.renderer.invalid
    if (render) {
      this.#workCounter.incrementRender()
      this.renderer.clear(0xffffb1ff)
      this.renderer.predraw(this.cam, this.framer)
      this.renderer.setDepth(true)
      this.renderer.draw(this.sprites)
      this.renderer.setDepth(false)
      this.renderer.draw(this.#filterSprites)
    }

    this.requestFrame(!V.debug?.invalid && !this.#invalidateToggle.on)
  }

  #initZoo(): void {
    // to-do: options vs setters. setters are more flexible.
    const bg = new V.FollowCamEnt(
      this,
      'background--OrangeCheckerboard',
      'Origin'
    )
    bg.w = 320
    bg.h = 240
    bg.z = V.Layer.Bottom

    this.#abc123 = this.sprites.alloc()
    this.#abc123.tag = 'abc123--ABC'
    this.#abc123.cel = 10
    this.#abc123.x = 200
    this.#abc123.y = 100
    this.#abc123.z = V.Layer.A
    this.#abc123.stretch = true
    this.#abc123.w *= 3
    this.#abc123.h *= 3

    const backpacker = this.sprites.alloc()
    backpacker.tag = 'backpacker--WalkRight'
    backpacker.x = 7
    backpacker.y = 7
    backpacker.z = V.Layer.C
    backpacker.stretch = true
    backpacker.w *= 5
    backpacker.h *= 5

    // to-do: this is invalid. I really don't want folks wirintg this.
    // ninep.xy.y = 300
    const heart = this.sprites.alloc()
    heart.tag = 'heart--Default'
    heart.x = -400
    heart.y = 0
    heart.z = V.Layer.E

    this.zoo.add(
      new V.CursorEnt(this, 'cursor--Pointer'),
      bg,
      new ClockEnt(),
      this.#invalidateToggle,
      this.#workCounter
    )

    const overlay = this.#filterSprites.alloc()
    overlay.tag = 'background--GreyCheckerboard'
    overlay.w = V.drawableMaxWH.w
    overlay.h = V.drawableMaxWH.h
    overlay.z = V.Layer.UIA

    const oidoid = this.sprites.alloc()
    oidoid.tag = 'oidoid--Default'
    oidoid.x = 48
    oidoid.y = 250
    oidoid.z = V.Layer.Bottom
    oidoid.flipX = true
    oidoid.flipY = true
  }

  #printInput(): void {
    if (this.input.started) {
      const on = !!this.input.on.length
      if (on) console.debug(`[input] buttons on: ${this.input.on.join(' ')}`)
      else console.debug(`[input] buttons off`)
      const combo = this.input.combo
      if (combo.length > 1 && on)
        console.debug(
          `[input] combo: ${combo.map(set => set.join('+')).join(' ')}`
        )
    }
    if (
      this.input.point?.invalid &&
      this.input.point?.click &&
      !this.input.point.pinch
    )
      console.debug(
        `[input] ${this.input.point.drag.on ? 'drag' : 'click'} xy: ${this.input.point.x} ${this.input.point.y}`
      )
    if (this.input.point?.pinch)
      console.debug(
        `[input] pinch xy: ${this.input.point.pinch.xy.x} ${this.input.point.pinch.xy.y}`
      )
    if (this.input.wheel)
      console.debug(
        `[input] wheel xy: ${this.input.wheel.delta.xy.x} ${this.input.wheel.delta.xy.y}`
      )
  }

  #startTimer(): void {
    this.#timer = setTimeout(
      () => {
        this.framer.requestFrame()
        this.#interval = setInterval(
          () => this.framer.requestFrame(),
          (V.debug?.seconds ? 1 : 60) * 1000
        )
      },
      delayMillis(new Date(), V.debug?.seconds)
    )
  }

  #stopTimer(): void {
    clearTimeout(this.#timer)
    clearInterval(this.#interval)
  }

  #updateCam(): boolean {
    let render = this.input.isAnyOn('L', 'R', 'U', 'D')

    if (this.input.isAnyOnStart('L', 'R', 'U', 'D')) {
      this.cam.x = Math.trunc(this.cam.x)
      this.cam.y = Math.trunc(this.cam.y)
    }

    const d = 1 / 4
    if (this.input.isOn('L')) this.cam.x -= d
    if (this.input.isOn('R')) this.cam.x += d
    if (this.input.isOn('U')) this.cam.y -= d
    if (this.input.isOn('D')) this.cam.y += d

    if (this.input.wheel?.delta.xy.y) {
      render = true
      this.cam.zoomOut -= this.input.wheel.delta.client.y * 0.01
    }

    this.cam.update(this.canvas)

    return render
  }
}

/**
 * returns [0, 59_999].
 * @internal
 */
export function delayMillis(
  time: Readonly<Date>,
  debugSecs: string | undefined
): number {
  return (
    ((debugSecs ? 0 : (59 - (time.getSeconds() % 60)) * 1000) +
      1000 -
      (time.getMilliseconds() % 1000)) %
    (debugSecs ? 1000 : 60_000)
  )
}
