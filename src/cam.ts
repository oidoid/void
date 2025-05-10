import type { WH, XY } from './types/2d.ts'

/** given a min WH and scale, size the camera to the max WH. */
export class Cam {
  readonly #clientWH: WH = {w: 1, h: 1}
  #h: number = 1
  #invalid: boolean = true
  #minScale: number = 1
  readonly #minWH: WH = {w: Infinity, h: Infinity}
  #mode: 'Int' | 'Fraction' = 'Fraction'
  #scale: number = 1
  #w: number = 1
  #x: number = 0
  #y: number = 0
  #zoomOut: number = 0

  /**
   * positive int dimensions in client px of canvas (often
   * `canvas.parentElement!.clientWidth/Height` since the canvas is resized)
   * which is assumed to be max WH.
   */
  get clientWH(): Readonly<WH> {
    return this.#clientWH
  }

  set clientWH(wh: Readonly<WH>) {
    if (this.#clientWH.w === wh.w && this.#clientWH.h === wh.h) return
    this.#clientWH.w = wh.w
    this.#clientWH.h = wh.h
    this.#invalidateWH()
  }

  /** true if cam moved or resized since last update. */
  get invalid(): boolean {
    return this.#invalid
  }

  /** positive int or fraction depending on mode. */
  get minScale(): number {
    return this.#minScale
  }

  set minScale(scale: number) {
    if (this.#scale === scale) return
    this.#scale = scale
    this.#invalidateWH()
  }

  /**
   * positive int or infinite min dimensions. set to
   * `{w: Infinity, h: Infinity}` to always use min scale.
   */
  get minWH(): Readonly<WH> {
    return this.#minWH
  }

  set minWH(wh: Readonly<WH>) {
    if (this.#minWH.w === wh.w && this.#minWH.h === wh.h) return
    this.#minWH.w = wh.w
    this.#minWH.h = wh.h
    this.#invalidateWH()
  }

  get mode(): 'Int' | 'Fraction' {
    return this.#mode
  }

  set mode(mode: 'Int' | 'Fraction') {
    if (this.#mode === mode) return
    this.#mode = mode
    this.#invalidateWH()
  }

  /** positive int. */
  get h(): number {
    return this.#h
  }

  /** positive int or fraction depending on mode. */
  get scale(): number {
    return this.#scale
  }

  /**
   * position relative canvas top-left in level scale (like level xy but no cam
   * offset). often used for UI that is fixed within the cam.
   */
  toCanvasXY(clientXY: Readonly<XY>): XY {
    return {
      x: (clientXY.x / this.#clientWH.w) * this.#w,
      y: (clientXY.y / this.#clientWH.h) * this.#h
    }
  }

  /** position in fractional level coordinates. */
  toXY(clientXY: Readonly<XY>): XY {
    const canvasXY = this.toCanvasXY(clientXY)
    return {x: this.#x + canvasXY.x, y: this.#y + canvasXY.y}
  }

  update(): void {
    this.#invalid = false
  }

  /** positive int. */
  get w(): number {
    return this.#w
  }

  /** fractional. */
  get x(): number {
    return this.#x
  }

  set x(x: number) {
    this.#invalid ||= this.x !== x
    this.#x = x
  }

  /** fractional. */
  get y(): number {
    return this.#y
  }

  set y(y: number) {
    this.#invalid ||= this.y !== y
    this.#y = y
  }

  get zoomOut(): number {
    return this.#zoomOut
  }

  /** nonnegative int or fraction depending on mode. */
  set zoomOut(out: number) {
    if (this.#zoomOut === out) return
    this.#zoomOut = out
    this.#invalidateWH()
  }

  #invalidateWH(): void {
    this.#invalid = true

    const phyWH = {
      w: Math.ceil(this.#clientWH.w * devicePixelRatio),
      h: Math.ceil(this.#clientWH.h * devicePixelRatio)
    }

    let scale = Math.max(
      this.#minScale,
      Math.min(phyWH.w / this.#minWH.w, phyWH.h / this.#minWH.h)
        - (this.#zoomOut)
    )
    // scale = Math.abs(Math.round(scale) - scale) < 0.05
    //   ? Math.round(scale) // if close to an int, use the int.
    //   : scale
    this.#scale = this.#mode === 'Int' ? Math.trunc(scale) : scale

    this.#w = Math.ceil(phyWH.w / this.#scale)
    this.#h = Math.ceil(phyWH.h / this.#scale)
  }
}
