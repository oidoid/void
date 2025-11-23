import * as V from '../index.ts'
import config from './assets/game.void.json' with {type: 'json'}
import {ClockEnt} from './ents/clock-ent.ts'
import {RenderToggleEnt} from './ents/render-toggle-ent.ts'
import {WorkCounterEnt} from './ents/work-counter-ent.ts'
import type {Tag} from './types/tag.ts'

declare module '../index.ts' {
  interface PoolMap<Tag extends V.TagFormat> {
    overlay: V.Pool<V.Sprite<Tag>>
  }
}

export class Game extends V.Void<Tag> {
  #renderToggle: RenderToggleEnt
  #workCounter: WorkCounterEnt

  constructor() {
    super({
      config: config as V.GameConfig,
      preloadAtlas: document.querySelector<HTMLImageElement>('#preload-atlas'),
      poll: {
        delay: () => renderDelayMillis(new Date(), V.debug?.seconds),
        period: ((V.debug?.seconds ? 1 : 60) * 1000) as V.Millis
      }
    })
    this.pool.overlay = new V.Pool<V.Sprite<Tag>>({
      alloc: pool => new V.Sprite(pool, 0, this.preload, this.looper),
      init: sprite => sprite.init(),
      allocBytes: V.drawableBytes,
      pageBlocks: 10
    })
    this.#renderToggle = new RenderToggleEnt(this)
    this.#renderToggle.on = this.renderer.always
    this.#workCounter = new WorkCounterEnt()
    this.#initZoo()
  }

  override onLoop(): void {
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
      this.renderer.clear(this.backgroundRGBA)
      this.renderer.predraw(this.cam)
      this.renderer.setDepth(true)
      this.renderer.draw(this.pool.default)
      this.renderer.setDepth(false)
      this.renderer.draw(this.pool.overlay)
    }
  }

  #initZoo(): void {
    const border = new V.NinePatchEnt<Tag>(this, {
      n: {tag: 'background--Black'},
      origin: {tag: 'background--Transparent'},
      border: {n: 1},
      z: V.Layer.UIG
    })
    this.zoo.add(border)
    const box = this.cam.follow({w: 0, h: 0}, V.Layer.UIG, 'NW', {fill: 'XY'})
    border.xy = box
    border.wh = box

    const backpacker = this.pool.default.alloc()
    backpacker.tag = 'backpacker--WalkRight'
    backpacker.x = 7
    backpacker.y = 7
    backpacker.z = V.Layer.C
    backpacker.stretch = true
    backpacker.w *= 5
    backpacker.h *= 5

    const oidoid = new V.FollowCamEnt(this, 'oidoid--Default', 'SW')
    oidoid.z = V.Layer.UIA
    oidoid.margin = {w: 4, h: 4}

    this.zoo.add(
      new V.CursorEnt(this, 'cursor--Pointer'),
      this.#renderToggle,
      new ClockEnt(),
      this.#workCounter,
      oidoid
    )

    const overlay = this.pool.overlay.alloc()
    overlay.tag = 'background--GreyCheckerboard'
    overlay.w = V.drawableMaxWH.w
    overlay.h = V.drawableMaxWH.h
    overlay.z = V.Layer.UIG
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
    let render = this.input.isAnyOn('U', 'D', 'L', 'R')

    if (this.input.isAnyOnStart('U', 'D', 'L', 'R'))
      this.cam.diagonalize(this.input.dir)

    const len = V.truncDrawableEpsilon(25 * this.tick.s)
    if (this.input.isOn('U')) this.cam.y -= len
    if (this.input.isOn('D')) this.cam.y += len
    if (this.input.isOn('L')) this.cam.x -= len
    if (this.input.isOn('R')) this.cam.x += len

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
