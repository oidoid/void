import { Uint } from '@/ooz'
import { Bitmap, ShaderLayout } from '@/void'

const littleEndian: boolean = new Int8Array(new Int16Array([1]).buffer)[0] == 1

export class BitmapBuffer {
  #view: DataView
  #buffer: ArrayBuffer
  #size: number
  readonly #layout: ShaderLayout

  get buffer(): DataView {
    return this.#view
  }

  get size(): number {
    return this.#size
  }

  constructor(layout: ShaderLayout, len: Uint = Uint(0)) {
    this.#buffer = new ArrayBuffer(layout.perInstance.stride * len)
    this.#view = new DataView(this.#buffer)
    this.#layout = layout
    this.#size = 0
  }

  set(index: number, bmp: Readonly<Bitmap>, time: number): void {
    // to-do: only copy dirty instances. replace removed instances with the
    // last element.
    const i = index * this.#layout.perInstance.stride
    this.#resize(i + this.#layout.perInstance.stride)
    this.#view.setUint16(i + 0, bmp.cel(time).id, littleEndian)
    this.#view.setInt16(i + 2, bmp.x, littleEndian)
    this.#view.setInt16(i + 4, bmp.y, littleEndian)
    this.#view.setInt16(i + 6, bmp.w, littleEndian)
    this.#view.setInt16(i + 8, bmp.h, littleEndian)
    this.#view.setUint16(i + 10, bmp.wrapLayerByHeightLayer, littleEndian)
    this.#size = index + 1
  }

  #resize(minLen: number): void {
    if (minLen <= this.#view.byteLength) return
    const prev = this.#buffer
    this.#buffer = new ArrayBuffer(minLen * 2)
    // Change the view to U8s for a endian-independent copy.
    new Uint8Array(this.#buffer).set(new Uint8Array(prev))
    this.#view = new DataView(this.#buffer)
  }
}
