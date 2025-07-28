export type PoolOpts<T extends Block> = {
  alloc(pool: Pool<T>): T
  allocBytes: number
  pageBlocks: number
  maxPages: number
}

export type Block = {/** variable pool index. */ i: number}

const maxCapacity: number = 0xffff_ffff // u32

/**
 * a contiguous resizable array with handle objects.
 *
 * alternatives:
 * - operating on the array without classes would probably be faster but the DX
 *   sucks:
 *     this.#sprite = this.#pool.alloc()
 *     this.#pool.setX(this.#sprite, this.#pool.getX(this.#sprite) + 1)
 * - setting a discard flag on sprites instead of handles may be more efficient
 *   but requires copying all elements on every frame and is sprite specific.
 * - sprite classes own all the data is nice DX but requires a copy on every
 *   frame.
 */
export class Pool<T extends Block> {
  readonly view: DataView<ArrayBuffer>
  readonly #allocBytes: number
  /** fixed len. blocks fragment on free. */
  readonly #blocks: readonly T[]
  /** the head of the free block linked list indexing into #blocks. */
  #free: number = 0
  readonly #maxPages: number
  readonly #pageBlocks: number
  #size: number = 0
  /** the next free block is always at size. resized to n pages. */
  readonly #u8: Uint8Array<ArrayBuffer>

  constructor(opts: Readonly<PoolOpts<T>>) {
    this.#allocBytes = opts.allocBytes
    this.#pageBlocks = opts.pageBlocks
    this.#maxPages = opts.maxPages
    if (this.capacity > maxCapacity) {
      throw Error(
        `max capacity (${this.capacity}) must be lesser or equal to ${maxCapacity}`
      )
    }
    const buffer = new ArrayBuffer(this.stride * opts.pageBlocks, {
      maxByteLength: this.stride * this.capacity
    })
    this.#u8 = new Uint8Array(buffer)
    this.view = new DataView(buffer)

    const blocks = new Array(this.capacity)
    for (let i = 0; i < blocks.length; i++) {
      blocks[i] = opts.alloc(this)
      blocks[i]!.i = i + 1
    }
    this.#blocks = blocks
  }

  alloc(): T {
    if (this.#size >= this.#currentCapacity) {
      if (this.#size >= this.capacity)
        throw Error(`pool overflow; capacity=${this.#currentCapacity}`)
      this.#u8.buffer.resize(
        this.#u8.buffer.byteLength + this.stride * this.#pageBlocks
      )
    }
    const handle = this.#free
    const block = this.#blocks[handle]!
    this.#free = block.i
    block.i = this.#size
    this.#setHandle(this.#size, handle)
    this.#size++
    return block
  }

  get capacity(): number {
    return this.#pageBlocks * this.#maxPages
  }

  clear(): void {
    for (let i = 0; i < this.#blocks.length; i++) this.#blocks[i]!.i = i + 1
    this.#free = 0
    this.#size = 0
  }

  free(block: T): void {
    if (!this.#size) throw Error('pool underflow')

    const handle = this.#getHandle(block.i)

    this.#size--
    const start = this.#size * this.stride
    this.#u8.copyWithin(block.i * this.stride, start, start + this.stride)
    this.#blocks[this.#getHandle(this.#size)]!.i = block.i

    block.i = this.#free
    this.#free = handle

    if (this.#currentCapacity - this.#size > this.#pageBlocks) {
      this.#u8.buffer.resize(
        this.#u8.buffer.byteLength - this.stride * this.#pageBlocks
      )
    }
  }

  get size(): number {
    return this.#size
  }

  get stride(): number {
    return this.#allocBytes + 4
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
    return this.view.getUint32(i * this.stride + this.#allocBytes, true)
  }

  #setHandle(i: number, handle: number): void {
    this.view.setUint32(i * this.stride + this.#allocBytes, handle, true)
  }
}
