import type {Box, WH, XY} from '../types/2d.js'

export class Cam implements Box {
  minWH: WH = {w: 256, h: 256}
  minScale: number = 1
  x: number = 0 //xy?
  y: number = 0
  lvl: Box = {x: -4096, y: -4096, w: 8191, h: 8191}

  readonly #clientWH: WH = {w: 1, h: 1}
  #scale = 1
  #w = this.minWH.w
  #h = this.minWH.h

  get h(): number {
    return this.#h
  }

  /** Fill or just barely not fill the viewport in scaled pixels. */
  resize(zoomOut?: number): void {
    // WH of body in CSS px; document.body.getBoundingClientRect() returns
    // incorrectly large sizing on mobile that includes the address bar
    this.#clientWH.w = innerWidth
    this.#clientWH.h = innerHeight

    const nativeW = Math.round(this.#clientWH.w * devicePixelRatio) // physical
    const nativeH = Math.round(this.#clientWH.h * devicePixelRatio)

    this.#scale = Math.max(
      this.minScale,
      Math.floor(Math.min(nativeW / this.minWH.w, nativeH / this.minWH.h)) -
        (zoomOut ?? 0) // Default is to zoom in as much as possible.
    )
    this.#w = Math.floor(nativeW / this.#scale)
    this.#h = Math.floor(nativeH / this.#scale)
  }

  get scale(): number {
    return this.#scale
  }

  /** Returns the integral position in level coordinates. */
  toLevelXY(clientXY: Readonly<XY>): XY {
    return {
      x: Math.round(this.x + (clientXY.x / this.#clientWH.w) * this.#w),
      y: Math.round(this.y + (clientXY.y / this.#clientWH.h) * this.#h)
    }
  }

  get w(): number {
    return this.#w
  }
}
