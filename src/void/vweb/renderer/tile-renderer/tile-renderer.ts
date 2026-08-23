import {buildProgram} from '../gl.ts'
import {tileFrag} from './tile.frag.glsl.ts'
import {tileVert} from './tile.vert.glsl.ts'

/** draws static, single-cel level tiles. */
export class TileRenderer {
  static new(
    gl: WebGL2RenderingContext,
    tiles: Uint16Array,
    tileW: number,
    tileH: number,
    levelW: number,
    levelH: number,
    atlasCelsTex: WebGLTexture,
    sprsheetTex: WebGLTexture
  ): TileRenderer {
    const pgm = buildProgram(gl, tileVert, tileFrag)
    const uResolution = gl.getUniformLocation(pgm, 'uResolution')!
    const uCamXY = gl.getUniformLocation(pgm, 'uCamXY')!
    const uLevelWH = gl.getUniformLocation(pgm, 'uLevelWH')!
    const uTileWH = gl.getUniformLocation(pgm, 'uTileWH')!

    const gridW = levelW / tileW
    const gridH = levelH / tileH

    const vao = gl.createVertexArray()!

    const tilesTex = gl.createTexture()!
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, tilesTex)
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
    gl.uniform2f(uLevelWH, levelW, levelH)
    gl.uniform2f(uTileWH, tileW, tileH)
    gl.uniform1i(gl.getUniformLocation(pgm, 'uTiles')!, 0)
    gl.uniform1i(gl.getUniformLocation(pgm, 'uAtlasCels')!, 1)
    gl.uniform1i(gl.getUniformLocation(pgm, 'uSprsheet')!, 2)
    gl.useProgram(null)

    return new TileRenderer(
      gl,
      pgm,
      uResolution,
      uCamXY,
      vao,
      tilesTex,
      atlasCelsTex,
      sprsheetTex
    )
  }

  readonly #gl: WebGL2RenderingContext
  readonly #pgm: WebGLProgram
  readonly #uResolution: WebGLUniformLocation
  readonly #uCamXY: WebGLUniformLocation
  readonly #vao: WebGLVertexArrayObject
  readonly #tilesTex: WebGLTexture
  // borrowed from SprRenderer and deleted there.
  readonly #atlasCelsTex: WebGLTexture
  readonly #sprsheetTex: WebGLTexture

  private constructor(
    gl: WebGL2RenderingContext,
    pgm: WebGLProgram,
    uResolution: WebGLUniformLocation,
    uCamXY: WebGLUniformLocation,
    vao: WebGLVertexArrayObject,
    tilesTex: WebGLTexture,
    atlasCelsTex: WebGLTexture,
    sprsheetTex: WebGLTexture
  ) {
    this.#gl = gl
    this.#pgm = pgm
    this.#uResolution = uResolution
    this.#uCamXY = uCamXY
    this.#vao = vao
    this.#tilesTex = tilesTex
    this.#atlasCelsTex = atlasCelsTex
    this.#sprsheetTex = sprsheetTex
  }

  dispose(): void {
    const gl = this.#gl
    gl.deleteProgram(this.#pgm)
    gl.deleteVertexArray(this.#vao)
    gl.deleteTexture(this.#tilesTex)
  }

  draw(
    camX: number,
    camY: number,
    resolutionW: number,
    resolutionH: number
  ): void {
    const gl = this.#gl
    gl.useProgram(this.#pgm)
    gl.uniform2f(this.#uCamXY, camX, camY)
    gl.uniform2i(this.#uResolution, resolutionW, resolutionH)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.#tilesTex)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.#atlasCelsTex)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, this.#sprsheetTex)
    gl.bindVertexArray(this.#vao)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.bindVertexArray(null)
  }
}
