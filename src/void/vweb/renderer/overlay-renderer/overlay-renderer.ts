import {buildProgram} from '../gl.ts'
import {overlayFrag} from './overlay.frag.ts'
import {overlayVert} from './overlay.vert.ts'

export class OverlayRenderer {
  static new(gl: WebGL2RenderingContext): OverlayRenderer {
    const pgm = buildProgram(gl, overlayVert, overlayFrag)
    const uResolution = gl.getUniformLocation(pgm, 'uResolution')!
    const uLayerOffsetPhy = gl.getUniformLocation(pgm, 'uLayerOffsetPhy')!
    const uCellSize = gl.getUniformLocation(pgm, 'uCellSize')!
    const vao = gl.createVertexArray()!
    return new OverlayRenderer(
      gl,
      pgm,
      uResolution,
      uLayerOffsetPhy,
      uCellSize,
      vao
    )
  }

  readonly #gl: WebGL2RenderingContext
  readonly #pgm: WebGLProgram
  readonly #uResolution: WebGLUniformLocation
  readonly #uLayerOffsetPhy: WebGLUniformLocation
  readonly #uCellSize: WebGLUniformLocation
  readonly #vao: WebGLVertexArrayObject

  private constructor(
    gl: WebGL2RenderingContext,
    pgm: WebGLProgram,
    uResolution: WebGLUniformLocation,
    uLayerOffsetPhy: WebGLUniformLocation,
    uCellSize: WebGLUniformLocation,
    vao: WebGLVertexArrayObject
  ) {
    this.#gl = gl
    this.#pgm = pgm
    this.#uResolution = uResolution
    this.#uLayerOffsetPhy = uLayerOffsetPhy
    this.#uCellSize = uCellSize
    this.#vao = vao
  }

  dispose(): void {
    this.#gl.deleteProgram(this.#pgm)
    this.#gl.deleteVertexArray(this.#vao)
  }

  draw(
    cellSize: number,
    levelClipPhy: {x: number; y: number; w: number; h: number}
  ): void {
    const gl = this.#gl
    gl.useProgram(this.#pgm)
    gl.uniform2i(
      this.#uResolution,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
    )
    gl.uniform2f(this.#uLayerOffsetPhy, levelClipPhy.x, levelClipPhy.y)
    gl.uniform1f(this.#uCellSize, cellSize)
    gl.bindVertexArray(this.#vao)
    gl.drawArrays(gl.TRIANGLES, 0, 3) // fullscreen triangle.
    gl.bindVertexArray(null)
  }
}
