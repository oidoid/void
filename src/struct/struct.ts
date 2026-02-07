import {debug} from '../utils/debug.ts'
import {StructLayout, type StructPropLayout} from './struct-layout.ts'
import type {StructSchema} from './struct-schema.ts'

export type Struct<Cursor extends StructCursor, Schema> = Cursor &
  Accessors<Schema>

export type StructArrayOpts<
  Cursor extends StructCursor,
  Schema extends StructSchema
> = {
  alloc(struct: StructArray<Cursor, Schema>): Cursor
  /** init page count. */
  pages?: number
  pageSize: number
}

export type StructCursor = {
  /** variable byte index. */
  cursor: number
}

type Accessors<Schema> = {
  [Prop in keyof Schema as Schema[Prop] extends 'bool'
    ? never
    : `get${Prop & string}`]: Getter<PropType<Schema[Prop]>>
} & {
  [Prop in keyof Schema as Schema[Prop] extends 'bool'
    ? `is${Prop & string}`
    : never]: Getter<boolean>
} & {
  [Prop in keyof Schema as `set${Prop & string}`]: Setter<
    PropType<Schema[Prop]>
  >
}
type Getter<V> = () => V
type Setter<V> = (v: V) => void
type PropType<Spec> = Spec extends 'bool' ? boolean : number

/** dense growable array of structs. */
export class StructArray<
  Cursor extends StructCursor,
  Schema extends StructSchema
> {
  /** struct size in bytes. */
  readonly stride: number
  /** structs per page. */
  readonly pageSize: number

  readonly #accessorProto: Accessors<Schema>
  readonly #alloc: (struct: StructArray<Cursor, Schema>) => Cursor
  #blocks: Struct<Cursor, Schema>[]
  #size: number = 0
  #u8: Uint8Array<ArrayBuffer>
  #view: DataView<ArrayBuffer>

  constructor(
    schema: Readonly<Schema>,
    opts: Readonly<StructArrayOpts<Cursor, Schema>>
  ) {
    const layout = StructLayout(schema as StructSchema)

    this.stride = layout.size
    this.#alloc = opts.alloc
    this.pageSize = opts.pageSize
    this.#u8 = new Uint8Array(
      new ArrayBuffer((opts.pages ?? 0) * this.pageSize * this.stride)
    )
    this.#view = new DataView(this.#u8.buffer)

    const accessorProto = {} as Record<string, unknown>
    for (const prop of layout.props) {
      const getName = `get${prop.name}` as const
      const setName = `set${prop.name}` as const

      switch (prop.type) {
        case 'Bool':
          accessorProto[`is${prop.name}`] = this.#GetBool(prop)
          accessorProto[setName] = this.#SetBool(prop)
          break
        case 'Byte':
          accessorProto[getName] = this.#GetByte(prop)
          accessorProto[setName] = this.#SetByte(prop)
          break
        case 'Float':
          accessorProto[getName] = this.#GetFloat(prop)
          accessorProto[setName] = this.#SetFloat(prop)
          break
        case 'Int':
          accessorProto[getName] = this.#GetInt(prop)
          accessorProto[setName] = this.#SetInt(prop)
          break
        case 'Short':
          accessorProto[getName] = this.#GetShort(prop)
          accessorProto[setName] = this.#SetShort(prop)
          break
      }
    }
    this.#accessorProto = accessorProto as Accessors<Schema>

    this.#blocks = Array(this.capacity)
    for (let i = 0; i < this.capacity; i++) {
      const block = this.#alloc(this) as Struct<Cursor, Schema>
      Object.setPrototypeOf(block, this.#accessorProto)
      this.#blocks[i] = block
    }
  }

  alloc(): Struct<Cursor, Schema> {
    if (this.#size === this.capacity) this.#grow(1, 'Alloc')
    const block = this.#blocks[this.#size]!
    block.cursor = this.#size * this.stride
    this.#size++
    return block
  }

  /** wrap a cursor into a block with accessors. */
  block(cursor: number): Struct<Cursor, Schema> {
    const block = {cursor} as Struct<Cursor, Schema>
    Object.setPrototypeOf(block, this.#accessorProto)
    return block
  }

  get buffer(): Uint8Array<ArrayBuffer> {
    return this.#u8
  }

  /** max usable structs. */
  get capacity(): number {
    return this.#u8.buffer.byteLength / this.stride
  }

  clear(): void {
    this.#u8.fill(0, 0, this.#size * this.stride)
    this.#size = 0
  }

  free(block: Readonly<Cursor>): void {
    if (!this.#size) throw Error('struct underflow')
    this.#size--
    const endI = this.size
    this.#u8.copyWithin(
      block.cursor,
      endI * this.stride,
      endI * this.stride + this.stride
    )
    this.#u8.fill(0, endI * this.stride, endI * this.stride + this.stride)
    const i = block.cursor / this.stride
    this.#blocks[this.#size]!.cursor = block.cursor
    ;[this.#blocks[i], this.#blocks[this.#size]] = [
      this.#blocks[this.#size]!,
      this.#blocks[i]!
    ]
  }

  grow(pages: number): void {
    this.#grow(pages, 'Grow')
  }

  get size(): number {
    return this.#size
  }

  /** order is not well defined. */
  *[Symbol.iterator](): IterableIterator<Struct<Cursor, Schema>> {
    for (let i = 0; i < this.#size; i++) yield this.#blocks[i]!
  }

  toDebugString(delim: string = ' '): string {
    let str = ''
    for (let i = 0; i < this.#u8.buffer.byteLength; i++) {
      if (i && !(i % this.stride)) str += delim
      str += this.#u8[i]!.toString(16).padStart(2, '0')
    }
    return str
  }

  #grow(pages: number, caller: 'Alloc' | 'Grow'): void {
    const prevCapacity = this.capacity
    const capacity = prevCapacity + pages * this.pageSize
    if (caller === 'Alloc' && debug?.mem)
      console.debug(`[mem] growing structs to ${capacity}`)

    const u8 = new Uint8Array(new ArrayBuffer(capacity * this.stride))
    u8.set(this.#u8)
    this.#u8 = u8
    this.#view = new DataView(u8.buffer)

    for (let i = prevCapacity; i < capacity; i++) {
      const block = this.#alloc(this) as Struct<Cursor, Schema>
      Object.setPrototypeOf(block, this.#accessorProto)
      this.#blocks.push(block)
    }
  }

  // ─── method factories ───

  #GetBool(prop: Readonly<StructPropLayout>): Getter<boolean> {
    const {offset, bit} = prop
    const struct = this
    return function (this: Cursor) {
      const word = struct.#view.getUint32(this.cursor + offset, true)
      return !!((word >>> bit) & 1)
    }
  }
  #SetBool(prop: Readonly<StructPropLayout>): Setter<boolean> {
    const {offset, bit} = prop
    const struct = this
    return function (this: Cursor, v: boolean) {
      const byteOffset = this.cursor + offset
      const word = struct.#view.getUint32(byteOffset, true)
      const next = v ? word | (1 << bit) : word & ~(1 << bit)
      struct.#view.setUint32(byteOffset, next, true)
    }
  }

  #GetByte(prop: Readonly<StructPropLayout>): Getter<number> {
    const {offset, signed, scale} = prop
    const struct = this
    if (signed) {
      if (scale === 1)
        return function (this: Cursor) {
          return struct.#view.getInt8(this.cursor + offset)
        }
      return function (this: Cursor) {
        return struct.#view.getInt8(this.cursor + offset) / scale
      }
    }
    if (scale === 1)
      return function (this: Cursor) {
        return struct.#view.getUint8(this.cursor + offset)
      }
    return function (this: Cursor) {
      return struct.#view.getUint8(this.cursor + offset) / scale
    }
  }
  #SetByte(prop: Readonly<StructPropLayout>): Setter<number> {
    const {offset, signed, scale} = prop
    const struct = this
    if (signed) {
      if (scale === 1)
        return function (this: Cursor, v: number) {
          struct.#view.setInt8(this.cursor + offset, v)
        }
      return function (this: Cursor, v: number) {
        struct.#view.setInt8(this.cursor + offset, v * scale)
      }
    }
    if (scale === 1)
      return function (this: Cursor, v: number) {
        struct.#view.setUint8(this.cursor + offset, v)
      }
    return function (this: Cursor, v: number) {
      struct.#view.setUint8(this.cursor + offset, v * scale)
    }
  }

  #GetFloat(prop: Readonly<StructPropLayout>): Getter<number> {
    const {offset, w} = prop
    const struct = this
    if (w === 16)
      return function (this: Cursor) {
        // @ts-expect-error to-do: add `ESNext.float16` to `lib`.
        return struct.#view.getFloat16(this.cursor + offset, true)
      }
    if (w === 32)
      return function (this: Cursor) {
        return struct.#view.getFloat32(this.cursor + offset, true)
      }
    return function (this: Cursor) {
      return struct.#view.getFloat64(this.cursor + offset, true)
    }
  }
  #SetFloat(prop: Readonly<StructPropLayout>): Setter<number> {
    const {offset, w} = prop
    const struct = this
    if (w === 16)
      return function (this: Cursor, v: number) {
        // @ts-expect-error to-do: add `ESNext.float16` to `lib`.
        struct.#view.setFloat16(this.cursor + offset, v, true)
      }
    if (w === 32)
      return function (this: Cursor, v: number) {
        struct.#view.setFloat32(this.cursor + offset, v, true)
      }
    return function (this: Cursor, v: number) {
      struct.#view.setFloat64(this.cursor + offset, v, true)
    }
  }

  #GetInt(prop: Readonly<StructPropLayout>): Getter<number> {
    const {offset, bit, w, signed, scale} = prop
    const struct = this

    if (w === 32) {
      if (signed) {
        if (scale === 1)
          return function (this: Cursor) {
            return struct.#view.getInt32(this.cursor + offset, true)
          }
        return function (this: Cursor) {
          return struct.#view.getInt32(this.cursor + offset, true) / scale
        }
      }
      if (scale === 1)
        return function (this: Cursor) {
          return struct.#view.getUint32(this.cursor + offset, true)
        }
      return function (this: Cursor) {
        return struct.#view.getUint32(this.cursor + offset, true) / scale
      }
    }

    const lshift = 32 - w - bit
    const rshift = 32 - w

    if (signed) {
      if (scale === 1)
        return function (this: Cursor) {
          const word = struct.#view.getUint32(this.cursor + offset, true)
          return (word << lshift) >> rshift
        }
      return function (this: Cursor) {
        const word = struct.#view.getUint32(this.cursor + offset, true)
        return ((word << lshift) >> rshift) / scale
      }
    }

    if (scale === 1)
      return function (this: Cursor) {
        const word = struct.#view.getUint32(this.cursor + offset, true)
        return (word << lshift) >>> rshift
      }
    return function (this: Cursor) {
      const word = struct.#view.getUint32(this.cursor + offset, true)
      return ((word << lshift) >>> rshift) / scale
    }
  }
  #SetInt(prop: Readonly<StructPropLayout>): Setter<number> {
    const {offset, bit, w, signed, scale} = prop
    const struct = this

    if (w === 32) {
      if (signed) {
        if (scale === 1)
          return function (this: Cursor, v: number) {
            struct.#view.setInt32(this.cursor + offset, v, true)
          }
        return function (this: Cursor, v: number) {
          struct.#view.setInt32(this.cursor + offset, v * scale, true)
        }
      }
      if (scale === 1)
        return function (this: Cursor, v: number) {
          struct.#view.setUint32(this.cursor + offset, v, true)
        }
      return function (this: Cursor, v: number) {
        struct.#view.setUint32(this.cursor + offset, v * scale, true)
      }
    }

    const mask = 0xffff_ffff >>> (32 - w)
    const rshift = 32 - w

    if (signed) {
      if (scale === 1)
        return function (this: Cursor, v: number) {
          const byteOffset = this.cursor + offset
          const word = struct.#view.getUint32(byteOffset, true)
          const cleared = word & ~((mask << bit) >>> 0)
          const bits = ((v << rshift) >> rshift) & mask
          const next = cleared | ((bits << bit) >>> 0)
          struct.#view.setUint32(byteOffset, next >>> 0, true)
        }
      return function (this: Cursor, v: number) {
        const byteOffset = this.cursor + offset
        const word = struct.#view.getUint32(byteOffset, true)
        const cleared = word & ~((mask << bit) >>> 0)
        const scaled = v * scale
        const bits = ((scaled << rshift) >> rshift) & mask
        const next = cleared | ((bits << bit) >>> 0)
        struct.#view.setUint32(byteOffset, next >>> 0, true)
      }
    }

    if (scale === 1)
      return function (this: Cursor, v: number) {
        const byteOffset = this.cursor + offset
        const word = struct.#view.getUint32(byteOffset, true)
        const cleared = word & ~((mask << bit) >>> 0)
        const next = cleared | (((v & mask) << bit) >>> 0)
        struct.#view.setUint32(byteOffset, next >>> 0, true)
      }
    return function (this: Cursor, v: number) {
      const byteOffset = this.cursor + offset
      const word = struct.#view.getUint32(byteOffset, true)
      const cleared = word & ~((mask << bit) >>> 0)
      const scaled = v * scale
      const next = cleared | (((scaled & mask) << bit) >>> 0)
      struct.#view.setUint32(byteOffset, next >>> 0, true)
    }
  }

  #GetShort(prop: Readonly<StructPropLayout>): Getter<number> {
    const {offset, signed, scale} = prop
    const struct = this
    if (signed) {
      if (scale === 1)
        return function (this: Cursor) {
          return struct.#view.getInt16(this.cursor + offset, true)
        }
      return function (this: Cursor) {
        return struct.#view.getInt16(this.cursor + offset, true) / scale
      }
    }
    if (scale === 1)
      return function (this: Cursor) {
        return struct.#view.getUint16(this.cursor + offset, true)
      }
    return function (this: Cursor) {
      return struct.#view.getUint16(this.cursor + offset, true) / scale
    }
  }
  #SetShort(prop: Readonly<StructPropLayout>): Setter<number> {
    const {offset, signed, scale} = prop
    const struct = this
    if (signed) {
      if (scale === 1)
        return function (this: Cursor, v: number) {
          struct.#view.setInt16(this.cursor + offset, v, true)
        }
      return function (this: Cursor, v: number) {
        struct.#view.setInt16(this.cursor + offset, v * scale, true)
      }
    }
    if (scale === 1)
      return function (this: Cursor, v: number) {
        struct.#view.setUint16(this.cursor + offset, v, true)
      }
    return function (this: Cursor, v: number) {
      struct.#view.setUint16(this.cursor + offset, v * scale, true)
    }
  }

  // ─── /method factories ───
}
