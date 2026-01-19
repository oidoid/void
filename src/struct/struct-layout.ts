import type {
  AnyStructIntW,
  StructPropSpec,
  StructSchema
} from './struct-schema.ts'

/** a parsed `StructSchema`. */
export type StructLayout = {
  props: StructPropLayout[]
  /** size in bytes. */
  size: number
}

export type StructPropLayout = PropLayoutBase & {
  /** byte offset. */
  offset: number
  /** bit offset from word. */
  bit: number
}

type PropLayoutBase = {
  /** prop name. */
  name: string
  /** `Byte` and `Short` are 8b and 16b byte-aligned `Int`s. */
  /**
   * `Byte` and `Short` are 8b and 16b byte-aligned `Int`s. 16b `Float`s are
   * byte-aligned; 32 and 64b are word-aligned.
   */
  type:
    | 'Bool'
    | 'Byte'
    | 'Float'
    | 'Int'
    | 'Object'
    | 'Short'
    | 'SID'
    | 'String'
  /** bit width. */
  w: AnyStructIntW | 64
  signed: boolean
  /** factor to divide set and multiple get. */
  scale: number
}

export function StructLayout(schema: StructSchema): StructLayout {
  const layout: StructPropLayout[] = []

  let wordOffset = 0
  let bit = 0
  for (const [name, spec] of Object.entries(schema)) {
    const prop = StructPropLayout(name, spec, wordOffset, bit)
    layout.push(prop)

    wordOffset =
      Math.floor(prop.offset / 4) * 4 + Math.floor((prop.bit + prop.w) / 32) * 4
    bit = (prop.bit + prop.w) % 32
  }

  return {props: layout, size: wordOffset + (bit ? 4 : 0)}
}

/** @internal */
export function StructPropLayout(
  name: string,
  spec: StructPropSpec,
  wordOffset: number,
  bit: number
): StructPropLayout {
  if (spec === 'F16') {
    const w = 16
    if (bit % 8) bit += 8 - (bit % 8) // byte-alignment required.

    if (bit && bit + w > 32) {
      wordOffset += 4
      bit = 0
    }

    return {
      name,
      type: 'Float',
      offset: wordOffset + bit / 8,
      bit,
      signed: false,
      scale: 1,
      w
    }
  }
  if (spec === 'F32')
    return {
      name,
      type: 'Float',
      offset: bit ? wordOffset + 4 : wordOffset,
      bit: 0,
      signed: false,
      scale: 1,
      w: 32
    }
  if (spec === 'F64')
    return {
      name,
      type: 'Float',
      offset: bit ? wordOffset + 4 : wordOffset,
      bit: 0,
      signed: false,
      scale: 1,
      w: 64
    }
  if (spec === 'Object')
    return {
      name,
      type: spec,
      offset: bit ? wordOffset + 4 : wordOffset,
      bit: 0,
      signed: false,
      scale: 1,
      w: 32
    }
  if (spec === 'SID')
    return {
      name,
      type: spec,
      offset: bit ? wordOffset + 4 : wordOffset,
      bit: 0,
      signed: false,
      scale: 1,
      w: 32
    }
  if (spec === 'String')
    return {
      name,
      type: spec,
      offset: bit ? wordOffset + 4 : wordOffset,
      bit: 0,
      signed: false,
      scale: 1,
      w: 32
    }

  if (spec === 'Bool') {
    const w = 1
    if (bit && bit + w > 32) {
      wordOffset += 4
      bit = 0
    }
    return {
      name,
      type: spec,
      offset: wordOffset,
      bit,
      signed: false,
      scale: 1,
      w
    }
  }

  const [, sign, wStr, scaleStr] = spec.match(/^([IU])(\d+)(?:\/(\d+))?$/) ?? []
  if (!sign || !wStr) throw Error(`invalid struct prop spec "${spec}"`)

  const w = parseInt(wStr, 10) as AnyStructIntW
  if (!(w >= 1 && w <= 32)) throw Error(`invalid struct prop spec w "${wStr}"`)

  const scale = parseInt(scaleStr ?? '1', 10)
  if (!(scale > 0)) throw Error(`invalid struct prop spec scale "${scaleStr}"`)

  if (bit && bit + w > 32) {
    wordOffset += 4
    bit = 0
  }

  const signed = sign === 'I'

  if (bit % 8 === 0 && w === 8)
    return {
      name,
      type: 'Byte',
      offset: wordOffset + bit / 8,
      bit,
      signed,
      scale,
      w
    }
  if (bit % 8 === 0 && w === 16)
    return {
      name,
      type: 'Short',
      offset: wordOffset + bit / 8,
      bit,
      signed,
      scale,
      w
    }
  return {name, type: 'Int', offset: wordOffset, bit, signed, scale, w}
}
