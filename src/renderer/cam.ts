import { Box, XY } from '@/ooz'
import {
  camWH,
  clientViewportWH,
  nativeViewportWH,
  viewportScale,
} from '@/void'

export class Cam {
  // Avoid possible division by zero by specifying nonzero widths and heights.

  readonly clientViewportWH: XY = new XY(1, 1)
  readonly nativeViewportWH: XY = new XY(1, 1)
  readonly minViewport: XY
  readonly viewport: Box = new Box(0, 0, 1, 1)

  #scale = 1
  readonly #window: Window

  constructor(minViewport: XY, window: Window) {
    this.minViewport = minViewport
    this.#window = window
  }

  /** Integral scale. */
  get scale(): number {
    return this.#scale
  }

  resize(): void {
    this.clientViewportWH.set(clientViewportWH(this.#window))
    this.nativeViewportWH.set(
      nativeViewportWH(this.#window, this.clientViewportWH),
    )
    this.#scale = viewportScale(
      this.nativeViewportWH,
      this.minViewport,
      0,
    )
    this.viewport.wh = camWH(this.nativeViewportWH, this.scale)
  }
}
