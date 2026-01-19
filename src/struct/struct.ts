import {debug} from '../utils/debug.ts'
import {StructLayout, type StructPropLayout} from './struct-layout.ts'
import type {StructSchema} from './struct-schema.ts'

/** dense growable array of structs. */
export type Struct<Schema> = StructBase & Accessors<Schema>

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
  const layout = StructLayout(schema)
  const base = new StructBase(layout, opts)
  const accessors = Accessors<Schema>(base, layout)
  return Object.assign(base, accessors)
}

class StructBase {
  /** struct size in bytes. */
  readonly stride: number
  /** structs per page. */
  readonly pageSize: number

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
  }

  alloc(): SID {
    if (this.size === this.capacity) this.#grow(1, 'Alloc')

    const sid = ++this.#sid as SID
    this.#indexBySID.set(sid, this.size)
    this._setSID(sid, this.#sidOffset, sid)

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

    if (i !== endI) this.#indexBySID.set(this.#sidByIndex(i), i)
  }

  /** does not clear dangling `RID`s in struct. */
  freeRefs(sid: SID): void {
    for (const offset of this.#refOffsets) {
      const rid = this._getRID(sid, offset)
      if (rid) this._freeRef(rid)
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

  #sidByIndex(i: number): SID {
    return this.#view.getUint32(i * this.stride + this.#sidOffset, true) as SID
  }

  _allocRef(): RID {
    return ++this.#rid as RID
  }

  _freeRef(rid: RID): void {
    this.#refByRID.delete(rid)
  }

  _setRef(rid: RID, v: Ref): void {
    this.#refByRID.set(rid, v)
  }

  _getRef(rid: RID): Ref {
    const v = this.#refByRID.get(rid)
    if (v === undefined) throw Error(`no ref ${rid}`)
    return v
  }

  _getRID(sid: SID, offset: number): MaybeRID {
    return this._getU32(sid, offset) as MaybeRID
  }

  _setRID(sid: SID, offset: number, v: MaybeRID): void {
    this._setU32(sid, offset, v)
  }

  _getSID(sid: SID, offset: number): MaybeSID {
    return this._getU32(sid, offset) as MaybeSID
  }

  _setSID(sid: SID, offset: number, v: MaybeSID): void {
    this._setU32(sid, offset, v)
  }

  _getU8(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    return this.#view.getUint8(i)
  }

  _setU8(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    this.#view.setUint8(i, v)
  }

  _getI8(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    return this.#view.getInt8(i)
  }

  _setI8(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    this.#view.setInt8(i, v)
  }

  _getU16(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    return this.#view.getUint16(i, true)
  }

  _setU16(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    this.#view.setUint16(i, v, true)
  }

  _getI16(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    return this.#view.getInt16(i, true)
  }

  _setI16(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    this.#view.setInt16(i, v, true)
  }

  _getU32(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    return this.#view.getUint32(i, true)
  }

  _setU32(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    this.#view.setUint32(i, v, true)
  }

  _getI32(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    return this.#view.getInt32(i, true)
  }

  _setI32(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    this.#view.setInt32(i, v, true)
  }

  _getF16(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    // @ts-expect-error to-do: add `ESNext.float16` to `lib`.
    return this.#view.getFloat16(i, true)
  }

  _setF16(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    // @ts-expect-error to-do: add `ESNext.float16` to `lib`.
    this.#view.setFloat16(i, v, true)
  }

  _getF32(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    return this.#view.getFloat32(i, true)
  }

  _setF32(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    this.#view.setFloat32(i, v, true)
  }

  _getF64(sid: SID, offset: number): number {
    const i = this.#getIndex(sid) * this.stride + offset
    return this.#view.getFloat64(i, true)
  }

  _setF64(sid: SID, offset: number, v: number): void {
    const i = this.#getIndex(sid) * this.stride + offset
    this.#view.setFloat64(i, v, true)
  }
}

function Accessors<Schema>(
  base: StructBase,
  layout: Readonly<StructLayout>
): Accessors<Schema> {
  const accessors: {[prop: string]: Getter<unknown> | Setter<never>} = {}
  for (const prop of layout.props) {
    accessors[`get${prop.name}`] = Getter(base, prop)
    accessors[`set${prop.name}`] = Setter(base, prop)
  }
  return accessors as Accessors<Schema>
}

function Getter(
  base: StructBase,
  prop: Readonly<StructPropLayout>
): Getter<unknown> {
  switch (prop.type) {
    case 'Bool':
      return GetBool(base, prop)
    case 'Byte':
      return GetByte(base, prop)
    case 'Float':
      return GetFloat(base, prop)
    case 'Int':
      return GetInt(base, prop)
    case 'Short':
      return GetShort(base, prop)
    case 'SID':
      return GetSID(base, prop)
    case 'Object':
    case 'String':
      return GetRef(base, prop)
  }
}

function Setter(
  base: StructBase,
  prop: Readonly<StructPropLayout>
): Setter<never> {
  switch (prop.type) {
    case 'Bool':
      return SetBool(base, prop)
    case 'Byte':
      return SetByte(base, prop)
    case 'Float':
      return SetFloat(base, prop)
    case 'Int':
      return SetInt(base, prop)
    case 'Short':
      return SetShort(base, prop)
    case 'SID':
      return SetSID(base, prop)
    case 'Object':
    case 'String':
      return SetRef(base, prop)
  }
}

function GetBool(
  base: StructBase,
  prop: Readonly<StructPropLayout>
): Getter<boolean> {
  const {offset, bit} = prop
  return sid => {
    const word = base._getU32(sid, offset)
    return !!((word >>> bit) & 1)
  }
}

function SetBool(
  base: StructBase,
  prop: Readonly<StructPropLayout>
): Setter<boolean> {
  const {offset, bit} = prop
  return (sid, v) => {
    const word = base._getU32(sid, offset)
    const next = v ? word | (1 << bit) : word & ~(1 << bit)
    base._setU32(sid, offset, next)
  }
}

function GetByte(
  base: StructBase,
  prop: Readonly<StructPropLayout>
): Getter<number> {
  const {offset, signed, scale} = prop
  if (signed) {
    if (scale === 1) return sid => base._getI8(sid, offset)
    return sid => base._getI8(sid, offset) / scale
  }
  if (scale === 1) return sid => base._getU8(sid, offset)
  return sid => base._getU8(sid, offset) / scale
}

function SetByte(
  base: StructBase,
  prop: Readonly<StructPropLayout>
): Setter<number> {
  const {offset, signed, scale} = prop

  if (signed) {
    if (scale === 1) return (sid, v) => base._setI8(sid, offset, v)
    return (sid, v) => base._setI8(sid, offset, v * scale)
  }

  if (scale === 1) return (sid, v) => base._setU8(sid, offset, v)

  return (sid, v) => base._setU8(sid, offset, v * scale)
}

function GetFloat(
  base: StructBase,
  prop: Readonly<StructPropLayout>
): Getter<number> {
  const {offset, w} = prop
  if (w === 16) return sid => base._getF16(sid, offset)
  if (w === 32) return sid => base._getF32(sid, offset)
  return sid => base._getF64(sid, offset)
}

function SetFloat(
  base: StructBase,
  prop: Readonly<StructPropLayout>
): Setter<number> {
  const {offset, w} = prop
  if (w === 16) return (sid, v) => base._setF16(sid, offset, v)
  if (w === 32) return (sid, v) => base._setF32(sid, offset, v)
  return (sid, v) => base._setF64(sid, offset, v)
}

function GetInt(
  base: StructBase,
  prop: Readonly<StructPropLayout>
): Getter<number> {
  const {offset, bit, w, signed, scale} = prop
  if (w === 32) {
    if (signed) {
      if (scale === 1) return sid => base._getI32(sid, offset)
      return sid => base._getI32(sid, offset) / scale
    }
    if (scale === 1) return sid => base._getU32(sid, offset)
    return sid => base._getU32(sid, offset) / scale
  }

  const lshift = 32 - w - bit
  const rshift = 32 - w

  if (signed) {
    if (scale === 1)
      return sid => {
        const word = base._getU32(sid, offset)
        return (word << lshift) >> rshift
      }
    return sid => {
      const word = base._getU32(sid, offset)
      return ((word << lshift) >> rshift) / scale
    }
  }

  if (scale === 1)
    return sid => {
      const word = base._getU32(sid, offset)
      return (word << lshift) >>> rshift
    }
  return sid => {
    const word = base._getU32(sid, offset)
    return ((word << lshift) >>> rshift) / scale
  }
}

function SetInt(
  base: StructBase,
  prop: Readonly<StructPropLayout>
): Setter<number> {
  const {offset, bit, w, signed, scale} = prop

  if (w === 32) {
    if (signed) {
      if (scale === 1) return (sid, v) => base._setI32(sid, offset, v)
      return (sid, v) => base._setI32(sid, offset, v * scale)
    }

    if (scale === 1) return (sid, v) => base._setU32(sid, offset, v)
    return (sid, v) => base._setU32(sid, offset, v * scale)
  }

  const mask = 0xffff_ffff >>> (32 - w)
  const rshift = 32 - w

  if (signed) {
    if (scale === 1)
      return (sid, v) => {
        const word = base._getU32(sid, offset)
        const cleared = word & ~((mask << bit) >>> 0)
        const bits = ((v << rshift) >> rshift) & mask
        const next = cleared | ((bits << bit) >>> 0)
        base._setU32(sid, offset, next >>> 0)
      }

    return (sid, v) => {
      const word = base._getU32(sid, offset)
      const cleared = word & ~((mask << bit) >>> 0)
      const scaled = v * scale
      const bits = ((scaled << rshift) >> rshift) & mask
      const next = cleared | ((bits << bit) >>> 0)
      base._setU32(sid, offset, next >>> 0)
    }
  }

  if (scale === 1)
    return (sid, v) => {
      const word = base._getU32(sid, offset)
      const cleared = word & ~((mask << bit) >>> 0)
      const next = cleared | (((v & mask) << bit) >>> 0)
      base._setU32(sid, offset, next >>> 0)
    }

  return (sid, v) => {
    const word = base._getU32(sid, offset)
    const cleared = word & ~((mask << bit) >>> 0)
    const scaled = v * scale
    const next = cleared | (((scaled & mask) << bit) >>> 0)
    base._setU32(sid, offset, next >>> 0)
  }
}

function GetShort(
  base: StructBase,
  prop: Readonly<StructPropLayout>
): Getter<number> {
  const {offset, signed, scale} = prop
  if (signed) {
    if (scale === 1) return sid => base._getI16(sid, offset)
    return sid => base._getI16(sid, offset) / scale
  }
  if (scale === 1) return sid => base._getU16(sid, offset)
  return sid => base._getU16(sid, offset) / scale
}

function SetShort(
  base: StructBase,
  prop: Readonly<StructPropLayout>
): Setter<number> {
  const {offset, signed, scale} = prop

  if (signed) {
    if (scale === 1) return (sid, v) => base._setI16(sid, offset, v)
    return (sid, v) => base._setI16(sid, offset, v * scale)
  }

  if (scale === 1) return (sid, v) => base._setU16(sid, offset, v)
  return (sid, v) => base._setU16(sid, offset, v * scale)
}

function GetRef(
  base: StructBase,
  prop: Readonly<StructPropLayout>
): Getter<Ref | undefined> {
  const {offset} = prop
  return sid => {
    const rid = base._getRID(sid, offset)
    if (!rid) return
    return base._getRef(rid)
  }
}

function SetRef(
  base: StructBase,
  prop: Readonly<StructPropLayout>
): Setter<Ref | undefined> {
  const {offset} = prop
  return (sid, v) => setRef(base, sid, offset, v)
}

function setRef(
  base: StructBase,
  sid: SID,
  offset: number,
  v: Ref | undefined
): void {
  let rid = base._getRID(sid, offset)

  if (v === undefined) {
    if (rid) {
      base._freeRef(rid)
      base._setRID(sid, offset, 0)
    }
    return
  }

  if (!rid) rid = base._allocRef()
  base._setRef(rid, v)
  base._setRID(sid, offset, rid)
}

function GetSID(
  base: StructBase,
  prop: Readonly<StructPropLayout>
): Getter<MaybeSID> {
  const {offset} = prop
  return sid => base._getSID(sid, offset)
}

function SetSID(
  base: StructBase,
  prop: Readonly<StructPropLayout>
): Setter<MaybeSID> {
  const {offset} = prop
  return (sid, v) => base._setSID(sid, offset, v)
}
