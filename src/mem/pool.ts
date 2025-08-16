import {debug} from '../types/debug.ts'

export type PoolOpts<T extends Block> = {
  alloc(pool: Pool<T>): T
  allocBytes: number
  minPages?: number
  pageBlocks: number
}

export type Block = {/** variable pool byte offset. */ i: number}

/**
 * a contiguous growable array with handle objects.
 *
 * alternatives:
 * - operating on the array without classes would probably be faster but the DX
 *   sucks:
 *     this.#sprite = this.#pool.alloc()
 *     this.#pool.setX(this.#sprite, this.#pool.getX(this.#sprite) + 1)
 * - setting a discard flag on sprites instead of handles may be more efficient
 *   but requires copying all elements on every frame and is sprite specific.
 * - sprite classes owning all the data is nice DX but requires a copy on every
 *   frame.
 * - ArrayBuffer.resize() is incompatible with WebGL.
 */
export class Pool<T extends Block> {
  /** sized to one page initially but only grows. blocks fragment on free. */
  readonly #blocks: T[]
  /** the head of the free block linked list indexing into #blocks. */
  #free: number = 0
  readonly #opts: Readonly<PoolOpts<T>>
  #size: number = 0
  /** the next free block is always at size. resized to n pages. */
  #u8: Uint8Array<ArrayBuffer>
  #view: DataView<ArrayBuffer>

  constructor(opts: Readonly<PoolOpts<T>>) {
    this.#opts = opts
    const initSize = (opts.minPages ?? 1) * opts.pageBlocks

    const buffer = new ArrayBuffer(this.stride * initSize)
    this.#u8 = new Uint8Array(buffer)
    this.#view = new DataView(buffer)

    this.#blocks = Array(initSize)
    for (let i = 0; i < initSize; i++) {
      this.#blocks[i] = opts.alloc(this)
      this.#blocks[i]!.i = i + 1 // next handle.
    }
  }

  alloc(): T {
    if (this.#size >= this.#currentCapacity) {
      const capacity = this.#currentCapacity + this.#opts.pageBlocks
      if (debug?.mem) console.debug(`[mem] growing pool to ${capacity}`)

      for (let i = this.#currentCapacity; i < capacity; i++) {
        this.#blocks[i] = this.#opts.alloc(this)
        this.#blocks[i]!.i = i + 1 // next handle.
      }

      const buffer = new ArrayBuffer(this.stride * capacity)
      const u8 = new Uint8Array(buffer)
      u8.set(this.#u8)
      this.#u8 = u8
      this.#view = new DataView(buffer)
    }
    const handle = this.#free
    const block = this.#blocks[handle]!
    this.#free = block.i
    block.i = this.#size * this.stride
    this.#setHandle(this.#size, handle)
    this.#size++
    return block
  }

  clear(): void {
    for (let i = 0; i < this.#blocks.length; i++) this.#blocks[i]!.i = i + 1
    this.#free = 0
    this.#size = 0
  }

  free(block: T): void {
    if (!this.#size) throw Error('pool underflow')

    const handle = this.#getHandle(block.i / this.stride)
    this.#size--
    const start = this.#size * this.stride
    this.#u8.copyWithin(block.i, start, start + this.stride)
    this.#blocks[this.#getHandle(this.#size)]!.i = block.i

    block.i = this.#free
    this.#free = handle
  }

  get size(): number {
    return this.#size
  }

  get stride(): number {
    return this.#opts.allocBytes + 4
  }

  get view(): DataView<ArrayBuffer> {
    return this.#view
  }

  toDebugString(): string {
    let str = ''
    for (let i = 0; i < this.#u8.buffer.byteLength; i++) {
      if (i && !(i % this.stride)) str += ' '
      str += this.#u8[i]!.toString(16).padStart(2, '0')
    }
    return str
  }

  get #currentCapacity(): number {
    return this.#u8.buffer.byteLength / this.stride
  }

  #getHandle(i: number): number {
    return this.view.getUint32(i * this.stride + this.#opts.allocBytes, true)
  }

  #setHandle(i: number, handle: number): void {
    this.view.setUint32(i * this.stride + this.#opts.allocBytes, handle, true)
  }
}
