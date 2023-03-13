import { I16, I16Box, NumXY, U16XY } from '@/ooz'
import { Viewport } from '@/void'

export class Cam {
  // Avoid possible division by zero by specifying nonzero widths and heights.

  readonly clientViewportWH: NumXY = new NumXY(1, 1)
  readonly nativeViewportWH: U16XY = new U16XY(1, 1)
  readonly minViewport: U16XY
  readonly viewport: I16Box = new I16Box(0, 0, 1, 1)

  #scale: I16 = I16(1)
  readonly #window: Window

  constructor(minViewport: U16XY, window: Window) {
    this.minViewport = minViewport
    this.#window = window
  }

  get scale(): I16 {
    return this.#scale
  }

  resize(): void {
    this.clientViewportWH.set(Viewport.clientViewportWH(this.#window))
    this.nativeViewportWH.set(
      Viewport.nativeViewportWH(this.#window, this.clientViewportWH),
    )
    this.#scale = Viewport.scale(
      this.nativeViewportWH,
      this.minViewport,
      I16(0),
    )
    this.viewport.wh = Viewport.camWH(this.nativeViewportWH, this.scale)
  }
}
