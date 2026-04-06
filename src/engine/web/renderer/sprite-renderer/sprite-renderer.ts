import {buildProgram} from '../gl.ts'
import {spriteFrag} from './sprite.frag.ts'
import {spriteVert} from './sprite.vert.ts'

export const spriteStride: number = 16

export class SpriteRenderer {
  static new(gl: WebGL2RenderingContext): SpriteRenderer {
    const pgm = buildProgram(gl, spriteVert, spriteFrag)
    const uResolution = gl.getUniformLocation(pgm, 'u_resolution')!

    // unit quad; two triangles covering [-1, 1]².
    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1])
    const quadVBO = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO)
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW)

    const instanceVBO = gl.createBuffer()!

    const vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)

    // a_uv; per-vertex quad corner from quadVBO.
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    // per-instance attributes from instanceVBO.
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceVBO)

    // a_xy.
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 0)
    gl.vertexAttribDivisor(1, 1)

    // a_radius (cast to float).
    gl.enableVertexAttribArray(2)
    gl.vertexAttribPointer(2, 1, gl.UNSIGNED_BYTE, false, 16, 8)
    gl.vertexAttribDivisor(2, 1)

    // a_color (normalized to [0.0, 1.0]).
    gl.enableVertexAttribArray(3)
    gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 16, 9)
    gl.vertexAttribDivisor(3, 1)

    gl.bindVertexArray(null)

    return new SpriteRenderer(gl, pgm, uResolution, quadVBO, vao, instanceVBO)
  }

  readonly #gl: WebGL2RenderingContext
  readonly #pgm: WebGLProgram
  readonly #uResolution: WebGLUniformLocation
  readonly #quadVBO: WebGLBuffer
  readonly #vao: WebGLVertexArrayObject
  readonly #instanceVBO: WebGLBuffer

  private constructor(
    gl: WebGL2RenderingContext,
    pgm: WebGLProgram,
    uResolution: WebGLUniformLocation,
    quadVBO: WebGLBuffer,
    vao: WebGLVertexArrayObject,
    instanceVBO: WebGLBuffer
  ) {
    this.#gl = gl
    this.#pgm = pgm
    this.#uResolution = uResolution
    this.#quadVBO = quadVBO
    this.#vao = vao
    this.#instanceVBO = instanceVBO
  }

  dispose(): void {
    const gl = this.#gl
    gl.deleteProgram(this.#pgm)
    gl.deleteVertexArray(this.#vao)
    gl.deleteBuffer(this.#quadVBO)
    gl.deleteBuffer(this.#instanceVBO)
  }

  draw(buffer: ArrayBuffer, spritePtr: number, count: number): void {
    if (!count) return
    const gl = this.#gl
    gl.useProgram(this.#pgm)

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

  resize(w: number, h: number): void {
    this.#gl.useProgram(this.#pgm)
    this.#gl.uniform2f(this.#uResolution, w, h)
  }
}
