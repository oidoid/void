import {buildProgram} from '../gl.ts'
import {overlayFrag} from './overlay.frag.ts'
import {overlayVert} from './overlay.vert.ts'

export class OverlayRenderer {
  static new(gl: WebGL2RenderingContext): OverlayRenderer {
    const pgm = buildProgram(gl, overlayVert, overlayFrag)
    const uResolution = gl.getUniformLocation(pgm, 'uResolution')!
    const uFrame = gl.getUniformLocation(pgm, 'uFrame')!
    const vao = gl.createVertexArray()!

    const frameTex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, frameTex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.bindTexture(gl.TEXTURE_2D, null)

    return new OverlayRenderer(gl, pgm, uResolution, uFrame, frameTex, vao)
  }

  readonly #gl: WebGL2RenderingContext
  readonly #pgm: WebGLProgram
  readonly #uResolution: WebGLUniformLocation
  readonly #uFrame: WebGLUniformLocation
  readonly #frameTex: WebGLTexture
  readonly #vao: WebGLVertexArrayObject

  private constructor(
    gl: WebGL2RenderingContext,
    pgm: WebGLProgram,
    uResolution: WebGLUniformLocation,
    uFrame: WebGLUniformLocation,
    frameTex: WebGLTexture,
    vao: WebGLVertexArrayObject
  ) {
    this.#gl = gl
    this.#pgm = pgm
    this.#uResolution = uResolution
    this.#uFrame = uFrame
    this.#frameTex = frameTex
    this.#vao = vao
  }

  dispose(): void {
    this.#gl.deleteProgram(this.#pgm)
    this.#gl.deleteVertexArray(this.#vao)
    this.#gl.deleteTexture(this.#frameTex)
  }

  draw(): void {
    const gl = this.#gl
    const w = gl.drawingBufferWidth
    const h = gl.drawingBufferHeight

    // capture the current framebuffer into `uFrame` before drawing over it.
    gl.bindTexture(gl.TEXTURE_2D, this.#frameTex)
    gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, w, h, 0)
    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.useProgram(this.#pgm)
    gl.uniform2i(this.#uResolution, w, h)
    gl.uniform1i(this.#uFrame, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.#frameTex)

    gl.bindVertexArray(this.#vao)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.bindVertexArray(null)

    gl.bindTexture(gl.TEXTURE_2D, null)
  }
}
