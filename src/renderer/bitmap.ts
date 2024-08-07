// to-do: what broke when doing divisional shifting to get 53b access? maybe the
// 32b sign bit was cumbersome?
// to-do: will levels support negative XY?
export type Bitmap = {
  /** 8x fixed-point XY: i16, 8y: i16; 1b sign, 12b int, 3b fraction. */
  readonly _xy: number
  /** w: u12, h: u12 */
  readonly _wh: number
  /** id+cel: u15, flipX: b1, flipY: b1, zend: b1, z: u3 */
  readonly _iffzz: number
}
