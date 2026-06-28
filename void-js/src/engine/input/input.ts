

type PointerState = Point & {
  /** false when pinched. */
  drag: {on: boolean; start: boolean; end: boolean}
  /** true if changed since last update. */
  invalid: boolean
  /** may be negative. */
  pinch:
    | {
        client: XY
        /** level / local. */
        xy: XY
      }
    | undefined

}

export class Input {


  readonly #contextMenu: ContextMenu


  get pointer(): {
    /** true while the pointer is within the canvas. */
    active: boolean
    dragMinClient: number
    locked: boolean
    lock(): Promise<void>
  } {
    return this.#pointer
  }

  /**
   * call on new frame before altering cam. dispatches always occur before an
   * update.
   * @arg millis duration since last update.
   */
  update(millis: Millis): void {
      const pinchClient = this.#pointer.pinchClient
      const dragOn =
        this.#pointer.primary.drag &&
        !Object.values(this.#pointer.secondary).length
      const secondary: Point[] = []

      this.#pointerState = {
        drag: {
          on: dragOn,
          start: !this.#pointerState?.drag.on && dragOn,
          end: !!this.#pointerState?.drag.on && !dragOn
        },
        pinch: pinchClient
          ? {client: pinchClient, xy: this.#cam.clientToXY(pinchClient)}
          : undefined,
        type: this.#pointer.primary.type,
        ...this.#cam.clientToXY(this.#pointer.primary.xyClient),
        client: this.#pointer.primary.xyClient,
        local: this.#cam.clientToXYLocal(this.#pointer.primary.xyClient)
      }
    }

}
