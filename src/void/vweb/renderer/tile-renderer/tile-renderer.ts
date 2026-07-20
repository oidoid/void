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
    levelH: number,
    atlasCels: Uint16Array,
    atlasAnimCount: number,
    atlasCelsPerAnim: number,
    atlasImg: HTMLImageElement
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

    const spritesheetTex = gl.createTexture()!
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, spritesheetTex)
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
    gl.uniform1i(gl.getUniformLocation(pgm, 'uSpritesheet')!, 2)
    gl.uniform2f(uAtlasSize, atlasImg.naturalWidth, atlasImg.naturalHeight)
    gl.useProgram(null)

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
      tilesTex,
      atlasCelsTex,
      spritesheetTex
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
  readonly #tilesTex: WebGLTexture
  readonly #atlasCelsTex: WebGLTexture
  readonly #spritesheetTex: WebGLTexture

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
    tilesTex: WebGLTexture,
    atlasCelsTex: WebGLTexture,
    spritesheetTex: WebGLTexture
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
    this.#tilesTex = tilesTex
    this.#atlasCelsTex = atlasCelsTex
    this.#spritesheetTex = spritesheetTex
  }

  dispose(): void {
    const gl = this.#gl
    gl.deleteProgram(this.#pgm)
    gl.deleteVertexArray(this.#vao)
    gl.deleteTexture(this.#tilesTex)
    gl.deleteTexture(this.#atlasCelsTex)
    gl.deleteTexture(this.#spritesheetTex)
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
    gl.uniform2f(this.#uLayerOffsetPhy, clipPhy.x, clipPhy.y)
    gl.uniform1f(this.#uLayerModulo, layerModulo)
    gl.uniform1i(this.#uRenderMode, renderMode)
    gl.uniform2i(
      this.#uResolution,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
    )
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.#tilesTex)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.#atlasCelsTex)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, this.#spritesheetTex)
    gl.bindVertexArray(this.#vao)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.bindVertexArray(null)
    for (let unit = 0; unit < 3; unit++) {
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, null)
    }
  }
}
