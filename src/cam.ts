import type { WH, XY } from './types/geo.ts'

export type LevelClientLocalXY = {
  /** position relative canvas top-left (in DPI scale). */
  client: XY,
  /**
   * position relative canvas top-left in level scale (like level xy but no cam
   * offset) within cam.
   */
  local: XY,
  /** level position within cam. */
  xy: XY
}

/** given a min WH and scale, size the camera to the max WH. */
export class Cam {
  #h: number = 1
  #invalid: boolean = true
  #minScale: number = 1
  readonly #minWH: WH = {w: Infinity, h: Infinity}
  #mode: 'Int' | 'Fraction' = 'Fraction'
  #scale: number = 1
  #w: number = 1
  readonly #whClient: WH = {w: 1, h: 1}
  #x: number = 0
  #y: number = 0
  #zoomOut: number = 0

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
   * `{w: Infinity, h: Infinity}` or `whClient` to always use min scale.
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

  /** positive int in level px. */
  get h(): number {
    return this.#h
  }

  /** positive int or fraction depending on mode. */
  get scale(): number {
    return this.#scale
  }

  /** position in fractional level coordinates. */
  toXY(client: Readonly<XY>): XY {
    const local = this.toXYLocal(client)
    return {x: this.#x + local.x, y: this.#y + local.y}
  }

  /**
   * position relative canvas top-left in level scale (like level xy but no cam
   * offset). often used for UI that is fixed within the cam.
   */
  toXYLocal(client: Readonly<XY>): XY {
    return {
      x: (client.x / this.#whClient.w) * this.#w,
      y: (client.y / this.#whClient.h) * this.#h
    }
  }

  update(): void {
    this.#invalid = false
  }

  /** positive int in level px. */
  get w(): number {
    return this.#w
  }

  /**
   * positive int dimensions in client px (DPI scale) of canvas (often
   * `canvas.parentElement!.clientWidth/Height` since the canvas is resized)
   * which is assumed to be max WH.
   */
  get whClient(): Readonly<WH> {
    return this.#whClient
  }

  set whClient(wh: Readonly<WH>) {
    if (this.#whClient.w === wh.w && this.#whClient.h === wh.h) return
    this.#whClient.w = wh.w
    this.#whClient.h = wh.h
    this.#invalidateWH()
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

    const whPhy = {
      w: Math.ceil(this.#whClient.w * devicePixelRatio),
      h: Math.ceil(this.#whClient.h * devicePixelRatio)
    }

    const scale = Math.max(
      this.#minScale,
      Math.min(whPhy.w / this.#minWH.w, whPhy.h / this.#minWH.h)
        - (this.#zoomOut)
    )
    // scale = Math.abs(Math.round(scale) - scale) < 0.05
    //   ? Math.round(scale) // if close to an int, use the int.
    //   : scale
    this.#scale = this.#mode === 'Int' ? Math.trunc(scale) : scale

    this.#w = Math.ceil(whPhy.w / this.#scale)
    this.#h = Math.ceil(whPhy.h / this.#scale)
  }
}
