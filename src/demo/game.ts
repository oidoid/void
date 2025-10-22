import * as V from '../index.ts'
import preloadAtlasJSON from './assets/preload-atlas.json' with {type: 'json'}
import {ClockEnt} from './ents/clock-ent.ts'
import {RenderToggleEnt} from './ents/render-toggle-ent.ts'
import {WorkCounterEnt} from './ents/work-counter-ent.ts'
import type {Tag} from './types/tag.ts'

export class Game extends V.Void<Tag> {
  #filterSprites: V.Pool<V.Sprite<Tag>>
  #renderToggle: RenderToggleEnt
  #workCounter: WorkCounterEnt

  constructor() {
    super({
      preloadAtlas: {
        image: document.querySelector('#preload-atlas')!,
        json: preloadAtlasJSON
      },
      backgroundRGBA: 0xffffb1ff,
      minWH: {w: 320, h: 240},
      poll: {
        delay: () => renderDelayMillis(new Date(), V.debug?.seconds),
        period: ((V.debug?.seconds ? 1 : 60) * 1000) as V.Millis
      }
    })
    this.#filterSprites = new V.Pool<V.Sprite<Tag>>({
      alloc: pool => new V.Sprite(pool, 0, this.preload, this.looper),
      allocBytes: V.drawableBytes,
      pageBlocks: 10
    })
    this.#renderToggle = new RenderToggleEnt(this)
    this.#renderToggle.on = this.renderer.always
    this.#workCounter = new WorkCounterEnt()
    this.#initZoo()
  }

  override onLoop(_millis: V.Millis): void {
    if (V.debug?.input) this.#printInput()
    this.renderer.always = this.#renderToggle.on

    let render = this.#updateCam()
    this.zoo.update(this)

    render ||=
      this.zoo.invalid ||
      this.cam.invalid ||
      this.renderer.invalid ||
      this.renderer.always
    if (render) {
      this.renderer.clear(0xffffb1ff)
      this.renderer.predraw(this.cam)
      this.renderer.setDepth(true)
      this.renderer.draw(this.sprites)
      this.renderer.setDepth(false)
      this.renderer.draw(this.#filterSprites)
    }
  }

  #initZoo(): void {
    const border = new V.NinePatchEnt<Tag>(this, {
      n: {tag: 'background--Black'},
      origin: {tag: 'background--Transparent'},
      border: {n: 1},
      z: V.Layer.UIA
    })
    this.zoo.add(border)
    const box = this.cam.follow({w: 0, h: 0}, V.Layer.UIA, 'NW', {fill: 'XY'})
    border.xy = box
    border.wh = box

    const backpacker = this.sprites.alloc()
    backpacker.tag = 'backpacker--WalkRight'
    backpacker.x = 7
    backpacker.y = 7
    backpacker.z = V.Layer.C
    backpacker.stretch = true
    backpacker.w *= 5
    backpacker.h *= 5

    const oidoid = new V.FollowCamEnt(this, 'oidoid--Default', 'SW')
    oidoid.z = V.Layer.UIG
    oidoid.margin = {w: 4, h: 4}

    this.zoo.add(
      new V.CursorEnt(this, 'cursor--Pointer'),
      this.#renderToggle,
      new ClockEnt(),
      this.#workCounter,
      oidoid
    )

    const overlay = this.#filterSprites.alloc()
    overlay.tag = 'background--GreyCheckerboard'
    overlay.w = V.drawableMaxWH.w
    overlay.h = V.drawableMaxWH.h
    overlay.z = V.Layer.UIA
  }

  #printInput(): void {
    if (this.input.started) {
      const on = !!this.input.on.length
      if (on) console.debug(`[input] buttons on: ${this.input.on.join(' ')}.`)
      else console.debug(`[input] buttons off.`)
      const combo = this.input.combo
      if (combo.length > 1 && on)
        console.debug(
          `[input] combo: ${combo.map(set => set.join('+')).join(' ')}.`
        )
    }
    if (
      this.input.point?.invalid &&
      this.input.point?.click &&
      !this.input.point.pinch
    )
      console.debug(
        `[input] ${this.input.point.drag.on ? 'drag' : 'click'} xy: ${this.input.point.x} ${this.input.point.y}.`
      )
    if (this.input.point?.pinch)
      console.debug(
        `[input] pinch xy: ${this.input.point.pinch.xy.x} ${this.input.point.pinch.xy.y}.`
      )
    if (this.input.wheel)
      console.debug(
        `[input] wheel xy: ${this.input.wheel.delta.xy.x} ${this.input.wheel.delta.xy.y}.`
      )
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
export function renderDelayMillis(
  time: Readonly<Date>,
  debugSecs: string | undefined
): V.Millis {
  return (((debugSecs ? 0 : (59 - (time.getSeconds() % 60)) * 1000) +
    1000 -
    (time.getMilliseconds() % 1000)) %
    (debugSecs ? 1000 : 60_000)) as V.Millis
}
