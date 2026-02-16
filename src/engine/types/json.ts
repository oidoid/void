export type JSONValue = JSONPrimitive | JSONArray | JSONObject
export type JSONObject = {[k: string]: JSONValue}
export type JSONArray = JSONValue[]
export type JSONPrimitive = boolean | null | number | string

/**
 * like `JSONValue` but deeply allow lossy undefined values that are easier to
 * type but may de/serialize incorrectly. eg:
 *
 * - `JSON.stringify({a: 1, b: undefined, c: 3})`: `'{"a":1,"c":3}'`.
 * - `JSON.stringify([1, undefined, 3])`: `'[1,null,3]'`.
 * - `JSON.stringify(undefined)`: `undefined`.
 *
 * the last case produces unparseable JSON and must be guarded against.
 *
 * `JSON.stringify()` accepts `any` input so there are no typing guards. prefer
 * plain `JSONValue`.
 *
 * the following inputs all throw but only the last is probable.
 *
 * - `JSON.parse('{a: 1, b: undefined, c: 3}')`.
 * - `JSON.parse('[1, undefined, 3]')`.
 * - `JSON.parse('undefined')`.
 */
export type PartialJSONValue =
  | PartialJSONPrimitive
  | PartialJSONArray
  | PartialJSONObject
export type PartialJSONObject = {[k in string]?: PartialJSONValue}
export type PartialJSONArray = PartialJSONValue[]
export type PartialJSONPrimitive = JSONPrimitive | undefined
