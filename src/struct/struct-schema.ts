/**
 * struct memory layout. each struct is a little-endian `TypedArray` element
 * where props are packed within 32b word sequences in declaration order:
 *
 * - bools are 1b.
 * - signed and unsigned ints are 1 - 32b. signs are extended on get. ints may
 *   specify a positive int scale to divide by on get and multiply by on set for
 *   fixed point. byte aligned prop accessors are optimized but not required.
 * - half-floats (`F16`) are 16b and byte-aligned.
 * - floats are 32b,
 * - doubles are 64b.
 * - strings and objects are 32b reference IDs (`RID`) that index a secondary
 *   lookup table where 0 is `undefined`. refs are held on defined set and freed
 *   on `undefined` set and must be freed by user before the struct is freed.
 * - struct IDs (`SID`) are 32b IDs that map to a buffer index from a secondary
 *   lookup table where 0 is `undefined`. unlike a `RID`, there's no concept of
 *   a dereferenced struct so IDs are used. user `SID`s are unmanaged.
 *
 * props do not straddle word boundaries. structs are multiples of 4B. props are
 * returned in big-endian. structs can only be allocated as array buffers.
 *
 * a `SID` is required for index to `SID` mapping and debugging as an implicit
 * `SID` member. modifying this member may break.
 */
export type StructSchema = {
  [prop: Capitalize<string>]: StructPropSpec
  SID: 'sid'
}

export type StructPropSpec =
  | 'bool'
  | 'f16'
  | 'f32'
  | 'f64'
  | `i${AnyStructIntW}`
  | `i${AnyStructIntW}/${number}`
  | 'obj'
  | 'sid'
  | 'str'
  | `u${AnyStructIntW}`
  | `u${AnyStructIntW}/${number}`

// biome-ignore format:;
export type AnyStructIntW =
   1 |  2 |  3 |  4 |  5 |  6 |  7 |  8 |  9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
  17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32
