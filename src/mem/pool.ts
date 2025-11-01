import {debug} from '../utils/debug.ts'

export type PoolOpts<out T extends Block> = {
  alloc(pool: Pool<T>): T
  init?(block: T): void
  allocBytes: number
  minPages?: number
  pageBlocks: number
}

export type Block = {/** variable pool byte offset. */ i: number}

/**
 * a contiguous resizable TypedArray associated with an array of objects.
 *
 * alternatives:
 * - operating on the array without classes would probably be faster but the DX
 *   sucks:
 *     this.#sprite = this.#pool.alloc()
 *     this.#pool.setX(this.#sprite, this.#pool.getX(this.#sprite) + 1)
 * - sprite classes owning all the data is nice DX but requires a copy on every
 *   frame.
 * - ArrayBuffer.resize() is incompatible with WebGL.
 */
export class Pool<out T extends Block> {
  /** the next free block is always at size. */
  readonly #blocks: T[]
  readonly #opts: Readonly<Required<PoolOpts<T>>>
  #size: number = 0
  #u8: Uint8Array<ArrayBuffer>
  #view!: DataView<ArrayBuffer>

  constructor(opts: Readonly<PoolOpts<T>>) {
    if (opts.allocBytes <= 0) throw Error('byte allocation must be > 0')
    if (opts.pageBlocks <= 0) throw Error('page blocks must be > 0')
    this.#opts = {
      ...opts,
      init: opts.init ?? (() => {}),
      minPages: opts.minPages ?? 1
    }
    const initSize = this.#opts.minPages * opts.pageBlocks
    this.#blocks = new Array(initSize)
    this.#u8 = new Uint8Array()
    this.#resize(initSize, 'Init')
  }

  alloc(): T {
    if (this.#size >= this.#currentCapacity)
      this.#resize(this.#currentCapacity + this.#opts.pageBlocks, 'Call')
    const block = this.#blocks[this.#size]!
    block.i = this.#size * this.#opts.allocBytes
    this.#size++
    this.#opts.init(block)
    return block
  }

  clear(): void {
    this.#size = 0
    const minCapacity = this.#opts.minPages * this.#opts.pageBlocks
    if (this.#currentCapacity > minCapacity) this.#resize(minCapacity, 'Call')
  }

  free(...blocks: readonly T[]): void {
    for (const block of blocks) this.#freeBlock(block)
  }

  get size(): number {
    return this.#size
  }

  get view(): DataView<ArrayBuffer> {
    return this.#view
  }

  toDebugString(): string {
    let str = ''
    for (let i = 0; i < this.#u8.buffer.byteLength; i++) {
      if (i && !(i % this.#opts.allocBytes)) str += ' '
      str += this.#u8[i]!.toString(16).padStart(2, '0')
    }
    return str
  }

  get #currentCapacity(): number {
    return this.#u8.buffer.byteLength / this.#opts.allocBytes
  }

  #freeBlock(block: T): void {
    if (!this.#size) throw Error('pool underflow')

    this.#size--
    const start = this.#size * this.#opts.allocBytes
    this.#u8.copyWithin(block.i, start, start + this.#opts.allocBytes)
    this.#blocks[this.#size]!.i = block.i
    ;[this.#blocks[block.i], this.#blocks[this.#size]] = [
      this.#blocks[this.#size]!,
      this.#blocks[block.i]!
    ]

    const free = Math.floor(
      (this.#currentCapacity - this.#size) / this.#opts.pageBlocks
    )
    if (
      free &&
      this.#currentCapacity / this.#opts.pageBlocks - free >=
        this.#opts.minPages
    )
      this.#resize(this.#currentCapacity - free * this.#opts.pageBlocks, 'Call')
  }

  #resize(capacity: number, origin: 'Init' | 'Call'): void {
    if (origin === 'Call' && debug?.mem)
      console.debug(
        `[mem] ${capacity < this.#currentCapacity ? 'shrinking' : 'growing'} pool to ${capacity}`
      )

    this.#blocks.length = capacity
    for (let i = this.#currentCapacity; i < capacity; i++)
      this.#blocks[i] = this.#opts.alloc(this)

    const buffer = new ArrayBuffer(capacity * this.#opts.allocBytes)
    const u8 = new Uint8Array(buffer)
    u8.set(this.#u8.subarray(0, capacity * this.#opts.allocBytes))
    this.#u8 = u8
    this.#view = new DataView(buffer)
  }
}
