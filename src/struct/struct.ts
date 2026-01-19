import {debug} from '../utils/debug.ts'
import {StructLayout, type StructPropLayout} from './struct-layout.ts'
import type {StructSchema} from './struct-schema.ts'

/** dense growable array of structs. */
export type Struct<Schema> = StructImpl & Accessors<Schema>

export type StructOpts = {
  /** init page count. */
  pages?: number
  pageSize: number
}

declare const sid: unique symbol
export type MaybeSID = SID | 0
export type SID = number & {[sid]: never}

declare const rid: unique symbol
type MaybeRID = RID | 0
type RID = number & {[rid]: never}

type Ref = string | object

type Accessors<Schema> = {
  [Prop in keyof Schema as `get${Prop & string}`]: Getter<
    PropType<Schema[Prop]>
  >
} & {
  [Prop in keyof Schema as `set${Prop & string}`]: Setter<
    PropType<Schema[Prop]>
  >
}
type Getter<V> = (sid: SID) => V
type Setter<V> = (sid: SID, v: V) => void
type PropType<Spec> = Spec extends 'Bool'
  ? boolean
  : Spec extends 'SID'
    ? MaybeSID
    : Spec extends 'String'
      ? string | undefined
      : Spec extends 'Object'
        ? object | undefined
        : number

export function Struct<Schema extends StructSchema>(
  schema: Readonly<Schema>,
  opts: Readonly<StructOpts>
): Struct<Schema> {
  return new StructImpl(StructLayout(schema), opts) as Struct<Schema>
}

class StructImpl {
  /** struct size in bytes. */
  readonly stride: number
  /** structs per page. */
  readonly pageSize: number;
  /** private implementation typing. */
  [prop: `get${string}` | `set${string}`]: Getter<unknown> | Setter<never>

  // to-do: some of these members could appear as preamble data within `#u8`.
  readonly #indexBySID: Map<SID, number> = new Map()
  readonly #refByRID: Map<RID, Ref> = new Map()
  #refOffsets: number[]
  #rid: MaybeRID = 0
  #sidOffset: number
  #sid: MaybeSID = 0
  #u8: Uint8Array<ArrayBuffer>
  #view: DataView<ArrayBuffer>

  constructor(layout: Readonly<StructLayout>, opts: Readonly<StructOpts>) {
    this.stride = layout.size
    const sidProp = layout.props.find(prop => prop.name === 'SID')
    if (!sidProp) throw Error('no struct SID')
    this.#refOffsets = layout.props
      .filter(prop => prop.type === 'Object' || prop.type === 'String')
      .map(prop => prop.offset)
    this.#sidOffset = sidProp.offset
    this.pageSize = opts.pageSize
    this.#u8 = new Uint8Array(
      new ArrayBuffer((opts.pages ?? 0) * this.pageSize * this.stride)
    )
    this.#view = new DataView(this.#u8.buffer)

    for (const prop of layout.props) {
      const getName = `get${prop.name}` as const
      const setName = `set${prop.name}` as const

      switch (prop.type) {
        case 'Bool':
          this[getName] = this.#GetBool(prop)
          this[setName] = this.#SetBool(prop)
          break
        case 'Byte':
          this[getName] = this.#GetByte(prop)
          this[setName] = this.#SetByte(prop)
          break
        case 'Float':
          this[getName] = this.#GetFloat(prop)
          this[setName] = this.#SetFloat(prop)
          break
        case 'Int':
          this[getName] = this.#GetInt(prop)
          this[setName] = this.#SetInt(prop)
          break
        case 'Short':
          this[getName] = this.#GetShort(prop)
          this[setName] = this.#SetShort(prop)
          break
        case 'SID':
          this[getName] = this.#GetSID(prop)
          this[setName] = this.#SetSID(prop)
          break
        case 'Object':
        case 'String':
          this[getName] = this.#GetRef(prop)
          this[setName] = this.#SetRef(prop)
          break
      }
    }
  }

  alloc(): SID {
    if (this.size === this.capacity) this.#grow(1, 'Alloc')

    const sid = ++this.#sid as SID
    this.#indexBySID.set(sid, this.size)
    this.#setSID(sid, this.#sidOffset, sid)

    return sid
  }

  get buffer(): Uint8Array<ArrayBuffer> {
    return this.#u8
  }

  /** max usable structs. */
  get capacity(): number {
    return this.#u8.buffer.byteLength / this.stride
  }

  clear(): void {
    this.#sid = 0
    this.#indexBySID.clear()
    this.#rid = 0
    this.#refByRID.clear()
    this.#u8.fill(0)
  }

  /** does not free refs. */
  free(sid: SID): void {
    const i = this.#getIndex(sid)
    this.#indexBySID.delete(sid)

    const endI = this.size
    this.#u8.copyWithin(
      i * this.stride,
      endI * this.stride,
      endI * this.stride + this.stride
    )
    this.#u8.fill(0, endI * this.stride, endI * this.stride + this.stride)

    if (i !== endI) {
      const swapSID = this.#view.getUint32(
        i * this.stride + this.#sidOffset,
        true
      ) as SID
      this.#indexBySID.set(swapSID, i)
    }
  }

  /** does not clear dangling `RID`s in struct. */
  freeRefs(sid: SID): void {
    for (const offset of this.#refOffsets) {
      const rid = this.#getRID(sid, offset)
      if (rid) this.#freeRef(rid)
    }
  }

  grow(pages: number): void {
    this.#grow(pages, 'Grow')
  }

  has(sid: SID): boolean {
    return this.#indexBySID.has(sid)
  }

  get size(): number {
    return this.#indexBySID.size
  }

  /** order is not well defined. */
  *[Symbol.iterator](): IterableIterator<SID> {
    for (const sid of this.#indexBySID.keys()) yield sid
  }

  toDebugString(delim: string = ' '): string {
    let str = ''
    for (let i = 0; i < this.#u8.buffer.byteLength; i++) {
      if (i && !(i % this.stride)) str += delim
      str += this.#u8[i]!.toString(16).padStart(2, '0')
    }
    return str
  }

  #getIndex(sid: SID): number {
    const i = this.#indexBySID.get(sid)
    if (i == null) throw Error(`no struct ${sid}`)
    return i
  }

  #grow(pages: number, caller: 'Alloc' | 'Grow'): void {
    const capacity = this.capacity + pages * this.pageSize
    if (caller === 'Alloc' && debug?.mem)
      console.debug(`[mem] growing structs to ${capacity}`)

    const u8 = new Uint8Array(new ArrayBuffer(capacity * this.stride))
    u8.set(this.#u8)
    this.#u8 = u8
    this.#view = new DataView(u8.buffer)
  }

  // ─── ref management ───

  #allocRef(): RID {
    return ++this.#rid as RID
  }
  #freeRef(rid: RID): void {
    this.#refByRID.delete(rid)
  }

  #getRef(rid: RID): Ref {
    const v = this.#refByRID.get(rid)
    if (v === undefined) throw Error(`no ref ${rid}`)
    return v
  }
  #setRef(rid: RID, v: Ref): void {
    this.#refByRID.set(rid, v)
  }

  // ─── /ref management ───

  // ─── #view accesors ───

  #getF16(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    // @ts-expect-error to-do: add `ESNext.float16` to `lib`.
    return this.#view.getFloat16(i, true)
  }
  #setF16(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    // @ts-expect-error to-do: add `ESNext.float16` to `lib`.
    this.#view.setFloat16(i, v, true)
  }

  #getF32(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    return this.#view.getFloat32(i, true)
  }
  #setF32(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    this.#view.setFloat32(i, v, true)
  }

  #getF64(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    return this.#view.getFloat64(i, true)
  }
  #setF64(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    this.#view.setFloat64(i, v, true)
  }

  #getI16(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    return this.#view.getInt16(i, true)
  }
  #setI16(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    this.#view.setInt16(i, v, true)
  }

  #getI32(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    return this.#view.getInt32(i, true)
  }
  #setI32(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    this.#view.setInt32(i, v, true)
  }

  #getI8(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    return this.#view.getInt8(i)
  }
  #setI8(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    this.#view.setInt8(i, v)
  }

  #getRID(sid: SID, offset: number): MaybeRID {
    return this.#getU32(sid, offset) as MaybeRID
  }
  #setRID(sid: SID, offset: number, v: MaybeRID): void {
    this.#setU32(sid, offset, v)
  }

  #getSID(sid: SID, offset: number): MaybeSID {
    return this.#getU32(sid, offset) as MaybeSID
  }
  #setSID(sid: SID, offset: number, v: MaybeSID): void {
    this.#setU32(sid, offset, v)
  }

  #getU16(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    return this.#view.getUint16(i, true)
  }
  #setU16(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    this.#view.setUint16(i, v, true)
  }

  #getU32(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    return this.#view.getUint32(i, true)
  }
  #setU32(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    this.#view.setUint32(i, v, true)
  }

  #getU8(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    return this.#view.getUint8(i)
  }
  #setU8(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    this.#view.setUint8(i, v)
  }

  // ─── /#view accesors ───

  // ─── method factories ───

  #GetBool(prop: Readonly<StructPropLayout>): Getter<boolean> {
    const {offset, bit} = prop
    return sid => {
      const word = this.#getU32(sid, offset)
      return !!((word >>> bit) & 1)
    }
  }
  #SetBool(prop: Readonly<StructPropLayout>): Setter<boolean> {
    const {offset, bit} = prop
    return (sid, v) => {
      const word = this.#getU32(sid, offset)
      const next = v ? word | (1 << bit) : word & ~(1 << bit)
      this.#setU32(sid, offset, next)
    }
  }

  #GetByte(prop: Readonly<StructPropLayout>): Getter<number> {
    const {offset, signed, scale} = prop
    if (signed) {
      if (scale === 1) return sid => this.#getI8(sid, offset)
      return sid => this.#getI8(sid, offset) / scale
    }
    if (scale === 1) return sid => this.#getU8(sid, offset)
    return sid => this.#getU8(sid, offset) / scale
  }
  #SetByte(prop: Readonly<StructPropLayout>): Setter<number> {
    const {offset, signed, scale} = prop

    if (signed) {
      if (scale === 1) return (sid, v) => this.#setI8(sid, offset, v)
      return (sid, v) => this.#setI8(sid, offset, v * scale)
    }

    if (scale === 1) return (sid, v) => this.#setU8(sid, offset, v)

    return (sid, v) => this.#setU8(sid, offset, v * scale)
  }

  #GetFloat(prop: Readonly<StructPropLayout>): Getter<number> {
    const {offset, w} = prop
    if (w === 16) return sid => this.#getF16(sid, offset)
    if (w === 32) return sid => this.#getF32(sid, offset)
    return sid => this.#getF64(sid, offset)
  }
  #SetFloat(prop: Readonly<StructPropLayout>): Setter<number> {
    const {offset, w} = prop
    if (w === 16) return (sid, v) => this.#setF16(sid, offset, v)
    if (w === 32) return (sid, v) => this.#setF32(sid, offset, v)
    return (sid, v) => this.#setF64(sid, offset, v)
  }

  #GetInt(prop: Readonly<StructPropLayout>): Getter<number> {
    const {offset, bit, w, signed, scale} = prop
    if (w === 32) {
      if (signed) {
        if (scale === 1) return sid => this.#getI32(sid, offset)
        return sid => this.#getI32(sid, offset) / scale
      }
      if (scale === 1) return sid => this.#getU32(sid, offset)
      return sid => this.#getU32(sid, offset) / scale
    }

    const lshift = 32 - w - bit
    const rshift = 32 - w

    if (signed) {
      if (scale === 1)
        return sid => {
          const word = this.#getU32(sid, offset)
          return (word << lshift) >> rshift
        }
      return sid => {
        const word = this.#getU32(sid, offset)
        return ((word << lshift) >> rshift) / scale
      }
    }

    if (scale === 1)
      return sid => {
        const word = this.#getU32(sid, offset)
        return (word << lshift) >>> rshift
      }
    return sid => {
      const word = this.#getU32(sid, offset)
      return ((word << lshift) >>> rshift) / scale
    }
  }
  #SetInt(prop: Readonly<StructPropLayout>): Setter<number> {
    const {offset, bit, w, signed, scale} = prop

    if (w === 32) {
      if (signed) {
        if (scale === 1) return (sid, v) => this.#setI32(sid, offset, v)
        return (sid, v) => this.#setI32(sid, offset, v * scale)
      }

      if (scale === 1) return (sid, v) => this.#setU32(sid, offset, v)
      return (sid, v) => this.#setU32(sid, offset, v * scale)
    }

    const mask = 0xffff_ffff >>> (32 - w)
    const rshift = 32 - w

    if (signed) {
      if (scale === 1)
        return (sid, v) => {
          const word = this.#getU32(sid, offset)
          const cleared = word & ~((mask << bit) >>> 0)
          const bits = ((v << rshift) >> rshift) & mask
          const next = cleared | ((bits << bit) >>> 0)
          this.#setU32(sid, offset, next >>> 0)
        }

      return (sid, v) => {
        const word = this.#getU32(sid, offset)
        const cleared = word & ~((mask << bit) >>> 0)
        const scaled = v * scale
        const bits = ((scaled << rshift) >> rshift) & mask
        const next = cleared | ((bits << bit) >>> 0)
        this.#setU32(sid, offset, next >>> 0)
      }
    }

    if (scale === 1)
      return (sid, v) => {
        const word = this.#getU32(sid, offset)
        const cleared = word & ~((mask << bit) >>> 0)
        const next = cleared | (((v & mask) << bit) >>> 0)
        this.#setU32(sid, offset, next >>> 0)
      }

    return (sid, v) => {
      const word = this.#getU32(sid, offset)
      const cleared = word & ~((mask << bit) >>> 0)
      const scaled = v * scale
      const next = cleared | (((scaled & mask) << bit) >>> 0)
      this.#setU32(sid, offset, next >>> 0)
    }
  }

  #GetRef(prop: Readonly<StructPropLayout>): Getter<Ref | undefined> {
    const {offset} = prop
    return sid => {
      const rid = this.#getRID(sid, offset)
      if (!rid) return
      return this.#getRef(rid)
    }
  }
  #SetRef(prop: Readonly<StructPropLayout>): Setter<Ref | undefined> {
    const {offset} = prop
    return (sid, v) => {
      let rid = this.#getRID(sid, offset)

      if (v === undefined) {
        if (rid) {
          this.#freeRef(rid)
          this.#setRID(sid, offset, 0)
        }
        return
      }

      if (!rid) rid = this.#allocRef()
      this.#setRef(rid, v)
      this.#setRID(sid, offset, rid)
    }
  }

  #GetShort(prop: Readonly<StructPropLayout>): Getter<number> {
    const {offset, signed, scale} = prop
    if (signed) {
      if (scale === 1) return sid => this.#getI16(sid, offset)
      return sid => this.#getI16(sid, offset) / scale
    }
    if (scale === 1) return sid => this.#getU16(sid, offset)
    return sid => this.#getU16(sid, offset) / scale
  }
  #SetShort(prop: Readonly<StructPropLayout>): Setter<number> {
    const {offset, signed, scale} = prop

    if (signed) {
      if (scale === 1) return (sid, v) => this.#setI16(sid, offset, v)
      return (sid, v) => this.#setI16(sid, offset, v * scale)
    }

    if (scale === 1) return (sid, v) => this.#setU16(sid, offset, v)
    return (sid, v) => this.#setU16(sid, offset, v * scale)
  }

  #GetSID(prop: Readonly<StructPropLayout>): Getter<MaybeSID> {
    const {offset} = prop
    return sid => this.#getSID(sid, offset)
  }
  #SetSID(prop: Readonly<StructPropLayout>): Setter<MaybeSID> {
    const {offset} = prop
    return (sid, v) => this.#setSID(sid, offset, v)
  }

  // ─── /method factories ───
}
