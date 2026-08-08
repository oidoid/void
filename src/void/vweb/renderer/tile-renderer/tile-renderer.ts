import {buildProgram} from '../gl.ts'
import {tileFrag} from './tile.frag.glsl.ts'
import {tileVert} from './tile.vert.glsl.ts'

export class TileRenderer {
  static new(
    gl: WebGL2RenderingContext,
    tiles: Uint16Array,
    tileW: number,
    tileH: number,
    levelX: number,
    levelY: number,
    levelW: number,
    levelH: number,
    atlasCels: Uint16Array,
    atlasAnimCount: number,
    atlasCelsPerAnim: number,
    atlasImg: HTMLImageElement
  ): TileRenderer {
    const pgm = buildProgram(gl, tileVert, tileFrag)
    const uResolution = gl.getUniformLocation(pgm, 'uResolution')!
    const uCamXY = gl.getUniformLocation(pgm, 'uCamXY')!
    const uNowMillis = gl.getUniformLocation(pgm, 'uNowMillis')!
    const uLevel = gl.getUniformLocation(pgm, 'uLevel')!
    const uTileWH = gl.getUniformLocation(pgm, 'uTileWH')!
    const uAtlasSize = gl.getUniformLocation(pgm, 'uAtlasSize')!

    const gridW = Math.ceil(levelW / tileW)
    const gridH = Math.ceil(levelH / tileH)

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

    const atlasCelsTex = gl.createTexture()!
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, atlasCelsTex)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA16UI,
      atlasCelsPerAnim,
      atlasAnimCount,
      0,
      gl.RGBA_INTEGER,
      gl.UNSIGNED_SHORT,
      atlasCels
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    const sprsheetTex = gl.createTexture()!
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, sprsheetTex)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      atlasImg
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.useProgram(pgm)
    gl.uniform4f(uLevel, levelX, levelY, levelW, levelH)
    gl.uniform2f(uTileWH, tileW, tileH)
    gl.uniform1i(gl.getUniformLocation(pgm, 'uTiles')!, 0)
    gl.uniform1i(gl.getUniformLocation(pgm, 'uAtlasCels')!, 1)
    gl.uniform1i(gl.getUniformLocation(pgm, 'uSprsheet')!, 2)
    gl.uniform2f(uAtlasSize, atlasImg.naturalWidth, atlasImg.naturalHeight)
    gl.useProgram(null)

    return new TileRenderer(
      gl,
      pgm,
      uResolution,
      uCamXY,
      uNowMillis,
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
  readonly #uNowMillis: WebGLUniformLocation
  readonly #vao: WebGLVertexArrayObject
  readonly #tilesTex: WebGLTexture
  readonly #atlasCelsTex: WebGLTexture
  readonly #sprsheetTex: WebGLTexture

  private constructor(
    gl: WebGL2RenderingContext,
    pgm: WebGLProgram,
    uResolution: WebGLUniformLocation,
    uCamXY: WebGLUniformLocation,
    uNowMillis: WebGLUniformLocation,
    vao: WebGLVertexArrayObject,
    tilesTex: WebGLTexture,
    atlasCelsTex: WebGLTexture,
    sprsheetTex: WebGLTexture
  ) {
    this.#gl = gl
    this.#pgm = pgm
    this.#uResolution = uResolution
    this.#uCamXY = uCamXY
    this.#uNowMillis = uNowMillis
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
    gl.deleteTexture(this.#atlasCelsTex)
    gl.deleteTexture(this.#sprsheetTex)
  }

  draw(
    nowMillis: number,
    camX: number,
    camY: number,
    resolutionW: number,
    resolutionH: number
  ): void {
    const gl = this.#gl
    gl.useProgram(this.#pgm)
    gl.uniform1f(this.#uNowMillis, nowMillis)
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
    for (let unit = 0; unit < 3; unit++) {
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, null)
    }
  }
}
