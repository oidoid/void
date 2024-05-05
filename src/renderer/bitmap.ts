export type Bitmap = {
  /** 8x fixed-point XY: i16, 8y: i16; 1b sign, 12b int, 3b fraction. */
  readonly _xy: number
  /** w: u12, h: u12 */
  readonly _wh: number
  /** id+cel: u15, flipX: b1, flipY: b1, zend: b1, z: u3 */
  readonly _iffzz: number
  /** User hint. */
  readonly debug?: unknown
}

export class BitmapBuffer {
  readonly buffer: Uint32Array
  size: number = 0

  constructor(capacity: number) {
    this.buffer = new Uint32Array(capacity * 3)
  }

  push(bmp: Readonly<Bitmap>): void {
    this.buffer[this.size * 3] = bmp._xy
    this.buffer[this.size * 3 + 1] = bmp._wh
    this.buffer[this.size * 3 + 2] = bmp._iffzz
    this.size++
  }
}
