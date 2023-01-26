import { Uint } from '@/oidlib'
import { ShaderLayout, Sprite } from '@/void'

const littleEndian: boolean = new Int8Array(new Int16Array([1]).buffer)[0] == 1

export class InstanceBuffer {
  #buffer: DataView
  #size: number
  readonly #layout: ShaderLayout

  get buffer(): DataView {
    return this.#buffer
  }

  get size(): number {
    return this.#size
  }

  constructor(
    layout: ShaderLayout,
    len: Uint = Uint(0),
  ) {
    this.#buffer = new DataView(
      new ArrayBuffer(layout.perInstance.stride * len),
    )
    this.#layout = layout
    this.#size = 0
  }

  // to-do: only copy dirty instances. replace removed instances with thel ast element. presrve the buffer on resize.
  resize(len: Uint): void {
    this.#buffer = new DataView(
      new ArrayBuffer(this.#layout.perInstance.stride * len),
    )
  }

  /** Tightly coupled to ShaderLayout and GLSL. */
  set(index: number, sprite: Readonly<Sprite>, time: number): void {
    const i = index * this.#layout.perInstance.stride
    if (this.#buffer.byteLength < (i + this.#layout.perInstance.stride)) {
      this.resize(Uint(Math.max(1, index) * 2))
      // to-do: assess resize need up front. This currently drops data on the
      // floor.
    }
    this.#buffer.setUint16(i + 0, sprite.cel(time).id, littleEndian)
    this.#buffer.setInt16(i + 2, sprite.x, littleEndian)
    this.#buffer.setInt16(i + 4, sprite.y, littleEndian)
    this.#buffer.setInt16(i + 6, sprite.w, littleEndian)
    this.#buffer.setInt16(i + 8, sprite.h, littleEndian)
    this.#buffer.setUint16(i + 10, sprite.wrapLayerByHeightLayer, littleEndian)
    this.#size = index + 1
  }
}
