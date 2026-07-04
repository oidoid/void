import {buildProgram} from '../gl.ts'
import {tileFrag} from './tile.frag.ts'
import {tileVert} from './tile.vert.ts'

export class TileRenderer {
  static new(
    gl: WebGL2RenderingContext,
    tiles: Uint16Array,
    tileW: number,
    tileH: number,
    levelX: number,
    levelY: number,
    levelW: number,
    levelH: number
  ): TileRenderer {
    const pgm = buildProgram(gl, tileVert, tileFrag)
    const uResolution = gl.getUniformLocation(pgm, 'uResolution')!
    const uCamXY = gl.getUniformLocation(pgm, 'uCamXY')!
    const uLayerScale = gl.getUniformLocation(pgm, 'uLayerScale')!
    const uLayerOffsetPhy = gl.getUniformLocation(pgm, 'uLayerOffsetPhy')!
    const uLayerModulo = gl.getUniformLocation(pgm, 'uLayerModulo')!
    const uRenderMode = gl.getUniformLocation(pgm, 'uRenderMode')!
    const uLevel = gl.getUniformLocation(pgm, 'uLevel')!
    const uTileWH = gl.getUniformLocation(pgm, 'uTileWH')!

    const gridW = Math.ceil(levelW / tileW)
    const gridH = Math.ceil(levelH / tileH)

    const vao = gl.createVertexArray()!

    const texture = gl.createTexture()!
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R16UI,
      gridW,
      gridH,
      0,
      gl.RED_INTEGER,
      gl.UNSIGNED_SHORT,
      tiles
    )
    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.useProgram(pgm)
    gl.uniform4f(uLevel, levelX, levelY, levelW, levelH)
    gl.uniform2f(uTileWH, tileW, tileH)

    return new TileRenderer(
      gl,
      pgm,
      uResolution,
      uCamXY,
      uLayerScale,
      uLayerOffsetPhy,
      uLayerModulo,
      uRenderMode,
      vao,
      texture
    )
  }

  readonly #gl: WebGL2RenderingContext
  readonly #pgm: WebGLProgram
  readonly #uResolution: WebGLUniformLocation
  readonly #uCamXY: WebGLUniformLocation
  readonly #uLayerScale: WebGLUniformLocation
  readonly #uLayerOffsetPhy: WebGLUniformLocation
  readonly #uLayerModulo: WebGLUniformLocation
  readonly #uRenderMode: WebGLUniformLocation
  readonly #vao: WebGLVertexArrayObject
  readonly #texture: WebGLTexture

  private constructor(
    gl: WebGL2RenderingContext,
    pgm: WebGLProgram,
    uResolution: WebGLUniformLocation,
    uCamXY: WebGLUniformLocation,
    uLayerScale: WebGLUniformLocation,
    uLayerOffsetPhy: WebGLUniformLocation,
    uLayerModulo: WebGLUniformLocation,
    uRenderMode: WebGLUniformLocation,
    vao: WebGLVertexArrayObject,
    texture: WebGLTexture
  ) {
    this.#gl = gl
    this.#pgm = pgm
    this.#uResolution = uResolution
    this.#uCamXY = uCamXY
    this.#uLayerScale = uLayerScale
    this.#uLayerOffsetPhy = uLayerOffsetPhy
    this.#uLayerModulo = uLayerModulo
    this.#uRenderMode = uRenderMode
    this.#vao = vao
    this.#texture = texture
  }

  dispose(): void {
    const gl = this.#gl
    gl.deleteProgram(this.#pgm)
    gl.deleteVertexArray(this.#vao)
    gl.deleteTexture(this.#texture)
  }

  draw(
    camX: number,
    camY: number,
    layerScale: number,
    clipPhy: {x: number; y: number; w: number; h: number},
    layerModulo: number,
    renderMode: number
  ): void {
    const gl = this.#gl
    gl.useProgram(this.#pgm)
    gl.uniform2f(this.#uCamXY, camX, camY)
    gl.uniform1f(this.#uLayerScale, layerScale)
    gl.uniform2f(
      this.#uLayerOffsetPhy,
      clipPhy.w && clipPhy.h ? clipPhy.x : 0,
      clipPhy.w && clipPhy.h ? clipPhy.y : 0
    )
    gl.uniform1f(this.#uLayerModulo, layerModulo)
    gl.uniform1i(this.#uRenderMode, renderMode)
    gl.uniform2i(
      this.#uResolution,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
    )
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.#texture)
    gl.bindVertexArray(this.#vao)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.bindVertexArray(null)
    gl.bindTexture(gl.TEXTURE_2D, null)
  }
}
