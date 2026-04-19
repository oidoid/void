import {buildProgram} from '../gl.ts'
import {spriteFrag} from './sprite.frag.ts'
import {spriteVert} from './sprite.vert.ts'

export const spriteStride: number = 16

export class SpriteRenderer {
  static new(gl: WebGL2RenderingContext): SpriteRenderer {
    const pgm = buildProgram(gl, spriteVert, spriteFrag)
    const uResolution = gl.getUniformLocation(pgm, 'uResolution')!
    const uCamXY = gl.getUniformLocation(pgm, 'uCamXY')!

    const instanceVBO = gl.createBuffer()!

    const vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)

    gl.bindBuffer(gl.ARRAY_BUFFER, instanceVBO)

    // aXY.
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0)
    gl.vertexAttribDivisor(0, 1)

    // aRadius (cast to float).
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 1, gl.UNSIGNED_BYTE, false, 16, 8)
    gl.vertexAttribDivisor(1, 1)

    // aColor (normalized to [0.0, 1.0]).
    gl.enableVertexAttribArray(2)
    gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 16, 9)
    gl.vertexAttribDivisor(2, 1)

    gl.bindVertexArray(null)

    return new SpriteRenderer(gl, pgm, uResolution, uCamXY, vao, instanceVBO)
  }

  readonly #gl: WebGL2RenderingContext
  readonly #pgm: WebGLProgram
  readonly #uResolution: WebGLUniformLocation
  readonly #uCamXY: WebGLUniformLocation
  readonly #vao: WebGLVertexArrayObject
  readonly #instanceVBO: WebGLBuffer

  private constructor(
    gl: WebGL2RenderingContext,
    pgm: WebGLProgram,
    uResolution: WebGLUniformLocation,
    uCamXY: WebGLUniformLocation,
    vao: WebGLVertexArrayObject,
    instanceVBO: WebGLBuffer
  ) {
    this.#gl = gl
    this.#pgm = pgm
    this.#uResolution = uResolution
    this.#uCamXY = uCamXY
    this.#vao = vao
    this.#instanceVBO = instanceVBO
  }

  dispose(): void {
    const gl = this.#gl
    gl.deleteProgram(this.#pgm)
    gl.deleteVertexArray(this.#vao)
    gl.deleteBuffer(this.#instanceVBO)
  }

  draw(
    buffer: ArrayBuffer,
    spritePtr: number,
    count: number,
    camX: number,
    camY: number
  ): void {
    if (!count) return
    const gl = this.#gl
    gl.useProgram(this.#pgm)
    gl.uniform2f(this.#uCamXY, camX, camY)
    gl.uniform2i(
      this.#uResolution,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
    )

    const bytes = new Uint8Array(buffer, spritePtr, count * spriteStride)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.#instanceVBO)
    gl.bufferData(gl.ARRAY_BUFFER, bytes, gl.DYNAMIC_DRAW)
    gl.bindVertexArray(this.#vao)
    gl.drawArraysInstanced(
      gl.TRIANGLES,
      0,
      6, // quad.
      count
    )
    gl.bindVertexArray(null)
  }
}
