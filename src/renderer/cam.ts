import type {Box, WH, XY} from '../types/2d.js'

export class Cam implements Box {
  valid: boolean = false
  minWH: WH = {w: 256, h: 256}
  minScale: number = 1
  lvl: Box = {x: -4096, y: -4096, w: 8191, h: 8191}

  readonly #clientWH: WH = {w: 1, h: 1}
  #h: number = this.minWH.h
  #scale: number = 1
  #w: number = this.minWH.w
  #x: number = 0
  #y: number = 0

  get h(): number {
    return this.#h
  }

  /** fill or just barely not fill the viewport in scaled pixels. */
  resize(zoomOut?: number): void {
    // WH of body in CSS px; document.body.getBoundingClientRect() returns
    // incorrectly large sizing on mobile that includes the address bar
    this.#clientWH.w = innerWidth
    this.#clientWH.h = innerHeight

    const nativeW = Math.round(this.#clientWH.w * devicePixelRatio) // physical.
    const nativeH = Math.round(this.#clientWH.h * devicePixelRatio)

    this.#scale = Math.max(
      this.minScale,
      Math.floor(Math.min(nativeW / this.minWH.w, nativeH / this.minWH.h)) -
        (zoomOut ?? 0) // default is to zoom in as much as possible.
    )
    const w = Math.floor(nativeW / this.#scale)
    const h = Math.floor(nativeH / this.#scale)
    if (w === this.#w && h === this.#h) return
    this.#w = w
    this.#h = h
    this.valid = false
  }

  get scale(): number {
    return this.#scale
  }

  /** @return integral position in level coordinates. */
  toLevelXY(clientXY: Readonly<XY>): XY {
    return {
      x: Math.round(this.#x + (clientXY.x / this.#clientWH.w) * this.#w),
      y: Math.round(this.#y + (clientXY.y / this.#clientWH.h) * this.#h)
    }
  }

  get w(): number {
    return this.#w
  }

  get x(): number {
    return this.#x
  }

  set x(x: number) {
    if (this.#x === x) return
    this.#x = x
    this.valid = false
  }

  get y(): number {
    return this.#y
  }

  set y(y: number) {
    if (this.#y === y) return
    this.#y = y
    this.valid = false
  }
}
