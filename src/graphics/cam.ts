import {
  type Box,
  boxHits,
  type CompassDir,
  type WH,
  type XY
} from '../types/geo.ts'
import {debug} from '../utils/debug.ts'
import {Layer} from './layer.ts'
import {diagonalize} from './sprite.ts'

export type LevelClientLocalXY = {
  /** position relative canvas top-left (in DPI scale). */
  client: XY
  /**
   * position relative canvas top-left in level scale (like level xy but no cam
   * offset) within cam.
   */
  local: XY
  /** level x-coord within cam. */
  x: number
  /** level y-coord within cam. */
  y: number
}

type Canvas = {
  width: number
  height: number
  style: {width: string; height: string}
  parentElement: {clientWidth: number; clientHeight: number} | null
}

/** given a min WH and scale, size the camera to the max WH. */
export class Cam {
  #devicePixelRatio: number = 0
  #h: number = 1
  #invalid: boolean = true
  #minScale: number = 1
  readonly #minWH: WH = {w: Infinity, h: Infinity}
  #mode: 'Int' | 'Fraction' = 'Int'
  #scale: number = 1
  #w: number = 1
  readonly #whClient: WH = {w: 1, h: 1}
  #x: number = 0
  #y: number = 0
  #zoomOut: number = 0

  center(xy: Readonly<XY>): void {
    this.x = Math.floor(xy.x - this.w / 2)
    this.y = Math.floor(xy.y - this.h / 2)
  }

  /** position in fractional level coordinates. */
  clientToXY(client: Readonly<XY>): XY {
    const local = this.clientToXYLocal(client)
    return {x: this.#x + local.x, y: this.#y + local.y}
  }

  /**
   * position relative canvas top-left in level scale (like level xy but no cam
   * offset). often used for UI that is fixed within the cam.
   */
  clientToXYLocal(client: Readonly<XY>): XY {
    return {
      x: (client.x / this.#whClient.w) * this.#w,
      y: (client.y / this.#whClient.h) * this.#h
    }
  }

  follow(
    wh: Readonly<WH>,
    z: Layer,
    pivot: CompassDir,
    opts?: {
      readonly fill?: 'X' | 'Y' | 'XY' | undefined
      readonly margin?: Partial<Readonly<WH>> | undefined
      readonly modulo?: Partial<Readonly<XY>> | undefined
    }
  ): Box {
    const marginW = opts?.margin?.w ?? 0
    let x = z > Layer.UIG ? Math.floor(this.x) : 0
    switch (pivot) {
      case 'SW':
      case 'W':
      case 'NW':
        x += marginW
        break
      case 'SE':
      case 'E':
      case 'NE':
        x += this.w - (wh.w + marginW)
        break
      case 'N':
      case 'S':
      case 'Origin':
        x += Math.trunc(this.w / 2) - Math.trunc(wh.w / 2)
        break
    }
    x -= x % ((opts?.modulo?.x ?? x) || 1)

    const marginH = opts?.margin?.h ?? 0
    let y = z > Layer.UIG ? Math.floor(this.y) : 0
    switch (pivot) {
      case 'N':
      case 'NE':
      case 'NW':
        y += marginH
        break
      case 'SE':
      case 'S':
      case 'SW':
        y += this.h - (wh.h + marginH)
        break
      case 'E':
      case 'W':
      case 'Origin':
        y += Math.trunc(this.h / 2) - Math.trunc(wh.h / 2)
        break
    }
    y -= y % ((opts?.modulo?.y ?? y) || 1)

    const w =
      opts?.fill === 'X' || opts?.fill === 'XY' ? this.w - 2 * marginW : wh.w
    const h =
      opts?.fill === 'Y' || opts?.fill === 'XY' ? this.h - 2 * marginH : wh.h

    return {x, y, w, h}
  }

  /** positive int in level px. */
  get h(): number {
    return this.#h
  }

  isVisible(box: Readonly<XY & Partial<WH>>): boolean {
    return boxHits(this, box)
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

  get portrait(): boolean {
    return this.h > this.w
  }

  postupdate(): void {
    this.#invalid = false
  }

  /** positive int or fraction depending on mode. */
  get scale(): number {
    return this.#scale
  }

  toString(): string {
    return `Cam{(${this.x} ${this.y}) ${this.w}×${this.h}}`
  }

  syncFraction(dir: Readonly<XY>): void {
    diagonalize(this, dir.x * dir.y)
  }

  /**
   * call after input processing but before ent processing. ents that move the
   * camera should be called immediately after update so that the invalid state
   * can be considered.
   */
  update(canvas: Canvas): void {
    if (!canvas.parentElement) throw Error('canvas has no parent')
    const {clientWidth, clientHeight} = canvas.parentElement

    this.#invalid ||=
      this.#whClient.w !== clientWidth ||
      this.#whClient.h !== clientHeight ||
      // doesn't seem like this should be necessary but it is when moving across
      // monitors.
      this.#devicePixelRatio !== devicePixelRatio
    if (!this.#invalid) return
    this.#devicePixelRatio = devicePixelRatio
    this.#whClient.w = clientWidth
    this.#whClient.h = clientHeight
    this.#invalidateWH()

    canvas.width = this.#w
    canvas.height = this.#h
    // ~parentW / parentH.
    canvas.style.width = `${(this.#w * this.#scale) / devicePixelRatio}px`
    canvas.style.height = `${(this.#h * this.#scale) / devicePixelRatio}px`
  }

  /** positive int in level px. */
  get w(): number {
    return this.#w
  }

  /**
   * positive int dimensions in client px of canvas (often
   * `canvas.parentElement.clientWidth/Height` since the canvas is resized)
   * which is assumed to be max WH.
   */
  get whClient(): Readonly<WH> {
    return this.#whClient
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

  /** nonnegative int or fraction depending on mode. */
  get zoomOut(): number {
    return this.#zoomOut
  }

  set zoomOut(out: number) {
    out = Math.max(0, out)
    if (this.#zoomOut === out) return
    this.#zoomOut = out
    this.#invalidateWH()
  }

  #invalidateWH(): void {
    if (!this.#invalid && debug?.invalid) console.debug('cam invalid')
    this.#invalid = true

    const phy = {
      w: this.#whClient.w * devicePixelRatio,
      h: this.#whClient.h * devicePixelRatio
    }

    const scale = Math.max(
      this.#minScale,
      Math.min(phy.w / this.#minWH.w, phy.h / this.#minWH.h) -
        (this.#mode === 'Int' ? Math.trunc(this.#zoomOut) : this.#zoomOut)
    )
    this.#scale = this.#mode === 'Int' ? Math.trunc(scale) : scale

    this.#w = Math.ceil(phy.w / this.#scale)
    this.#h = Math.ceil(phy.h / this.#scale)
  }
}
