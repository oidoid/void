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
 *
 * props do not straddle word boundaries. structs are multiples of 4B. props are
 * returned in big-endian. structs can only be allocated as array buffers.
 */
export type StructSchema = {[prop: Capitalize<string>]: StructPropSpec}

export type StructPropSpec =
  | 'bool'
  | 'f16'
  | 'f32'
  | 'f64'
  | `i${AnyStructIntW}`
  | `i${AnyStructIntW}/${number}`
  | `u${AnyStructIntW}`
  | `u${AnyStructIntW}/${number}`

// biome-ignore format:;
export type AnyStructIntW =
   1 |  2 |  3 |  4 |  5 |  6 |  7 |  8 |  9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
  17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32
