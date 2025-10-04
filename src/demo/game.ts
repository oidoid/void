import * as V from '../index.ts'
import atlasJSON from './atlas.json'
import {ClockEnt} from './ents/clock-ent.ts'
import {InvalidateToggleEnt} from './ents/invalidate-toggle-ent.ts'
import {WorkCounterEnt} from './ents/work-counter-ent.ts'
import type {Tag} from './tag.ts'

declare module '../index.ts' {
  interface Debug {
    /** always render. */
    invalid?: string
    // to-do: fix always invalidate button.
    /** update the clock at least once a second instead of once a minute. */
    seconds?: string
  }
}

export class Game extends V.Void<Tag> {
  filters: V.Pool<V.Sprite<Tag>>
  // to-do: rework.
  #abc123?: V.Sprite<Tag>
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
    this.filters = new V.Pool<V.Sprite<Tag>>({
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

  override onFrame(millis: V.Millis): boolean | undefined {
    if (super.onFrame(millis)) return
    this.input.update(millis)
    this.cam.update(this.canvas)

    const epsilon = 1 / 4 // 1 / 64 //to-do:1/16 and move to sprite or something.
    if (this.input.isAnyOnStart('L', 'R', 'U', 'D')) {
      this.cam.x = Math.trunc(this.cam.x)
      this.cam.y = Math.trunc(this.cam.y)
    }
    if (this.input.isOn('L')) this.cam.x -= epsilon
    if (this.input.isOn('R')) this.cam.x += epsilon
    if (this.input.isOn('U')) this.cam.y -= epsilon
    if (this.input.isOn('D')) this.cam.y += epsilon

    let render = false
    if (this.input.wheel?.delta.xy.y) {
      render = true
      this.cam.zoomOut =
        this.cam.zoomOut - Math.sign(this.input.wheel.delta.xy.y)
    }
    // this.cam.zoomOut = 2
    let updated = this.zoo.update(this)

    if (this.#abc123?.looped) {
      this.#abc123.tag =
        this.#abc123.tag === 'abc123--123' ? 'abc123--ABC' : 'abc123--123'
      this.#abc123.w *= 3
      this.#abc123.h *= 3 // to-do: not a good option here? surprising not to change size, surprising to.
      updated = true
    }
    if (V.debug?.input) this.#printInput()

    render ||=
      updated ||
      !!V.debug?.invalid ||
      this.#invalidateToggle.on ||
      this.cam.invalid ||
      this.renderer.invalid
    this.#workCounter.record(this, render ? 'Render' : 'Update')
    if (render) {
      this.renderer.clear(0xffffb1ff)
      this.renderer.predraw(this.cam, this.framer)
      this.renderer.setDepth(true)
      this.renderer.draw(this.sprites)
      this.renderer.setDepth(false)
      this.renderer.draw(this.filters)
    }

    if (
      this.input.anyOn ||
      this.input.gamepad ||
      V.debug?.invalid ||
      this.#invalidateToggle.on
    )
      this.framer.requestFrame()

    this.cam.postupdate()
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

    const overlay = this.filters.alloc()
    overlay.tag = 'background--GreyCheckerboard'
    overlay.w = V.spriteMaxWH.w
    overlay.h = V.spriteMaxWH.h
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
    const now = new Date()
    const delay =
      (V.debug?.seconds ? 0 : (59 - (now.getSeconds() % 60)) * 1000) +
      1000 -
      (now.getMilliseconds() % 1000)
    this.#timer = setTimeout(() => {
      this.framer.requestFrame()
      this.#interval = setInterval(
        () => this.framer.requestFrame(),
        (V.debug?.seconds ? 1 : 60) * 1000
      )
    }, delay)
  }

  #stopTimer(): void {
    clearTimeout(this.#timer)
    clearInterval(this.#interval)
  }
}
