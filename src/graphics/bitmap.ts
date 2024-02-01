export type Bitmap = {
  /** 8x: i16, 8y: i16 */
  readonly _xy: number
  /** w: u12, h: u12 */
  readonly _wh: number
  /** id+cel: u15, flipX: b1, flipY: b1, zend: b1, z: u3 */
  readonly _iffzz: number
}

export class BitmapBuffer {
  readonly buffer: Uint32Array
  size = 0

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
