import type {BoardConfig} from '../board-config.ts'
import {buildProgram} from '../gl.ts'
import tileFrag from './tile.frag.glsl'
import tileVert from './tile.vert.glsl'

const emptyTiles = new Uint16Array(1)

/** draws static, single-cel board tiles. */
export class TileRenderer {
  static new(
    gl: WebGL2RenderingContext,
    board: Readonly<BoardConfig>,
    atlasCelsTex: WebGLTexture,
    sprsheetTex: WebGLTexture
  ): TileRenderer {
    const pgm = buildProgram(gl, tileVert, tileFrag)
    const uResolution = gl.getUniformLocation(pgm, 'uResolution')!
    const uCamXY = gl.getUniformLocation(pgm, 'uCamXY')!
    const uBoardWH = gl.getUniformLocation(pgm, 'uBoardWH')!
    const uTileWH = gl.getUniformLocation(pgm, 'uTileWH')!

    const vao = gl.createVertexArray()!

    const tilesTex = gl.createTexture()!
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, tilesTex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.useProgram(pgm)
    gl.uniform1i(gl.getUniformLocation(pgm, 'uTiles')!, 0)
    gl.uniform1i(gl.getUniformLocation(pgm, 'uAtlasCels')!, 1)
    gl.uniform1i(gl.getUniformLocation(pgm, 'uSprsheet')!, 2)
    gl.useProgram(null)

    const renderer = new TileRenderer(
      gl,
      pgm,
      uResolution,
      uCamXY,
      uBoardWH,
      uTileWH,
      vao,
      tilesTex,
      atlasCelsTex,
      sprsheetTex
    )
    renderer.update(board)
    return renderer
  }

  readonly #gl: WebGL2RenderingContext
  readonly #pgm: WebGLProgram
  readonly #uResolution: WebGLUniformLocation
  readonly #uCamXY: WebGLUniformLocation
  readonly #uBoardWH: WebGLUniformLocation
  readonly #uTileWH: WebGLUniformLocation
  readonly #vao: WebGLVertexArrayObject
  readonly #tilesTex: WebGLTexture
  // borrowed from SprRenderer and deleted there.
  readonly #atlasCelsTex: WebGLTexture
  readonly #sprsheetTex: WebGLTexture
  /** allocated tile texture width in cells. */
  #gridW: number = 0
  /** allocated tile texture height in cells. */
  #gridH: number = 0

  private constructor(
    gl: WebGL2RenderingContext,
    pgm: WebGLProgram,
    uResolution: WebGLUniformLocation,
    uCamXY: WebGLUniformLocation,
    uBoardWH: WebGLUniformLocation,
    uTileWH: WebGLUniformLocation,
    vao: WebGLVertexArrayObject,
    tilesTex: WebGLTexture,
    atlasCelsTex: WebGLTexture,
    sprsheetTex: WebGLTexture
  ) {
    this.#gl = gl
    this.#pgm = pgm
    this.#uResolution = uResolution
    this.#uCamXY = uCamXY
    this.#uBoardWH = uBoardWH
    this.#uTileWH = uTileWH
    this.#vao = vao
    this.#tilesTex = tilesTex
    this.#atlasCelsTex = atlasCelsTex
    this.#sprsheetTex = sprsheetTex
  }

  update(board: Readonly<BoardConfig>): void {
    const empty = !board.tiles.length
    const tiles = empty ? emptyTiles : board.tiles
    const cols = empty ? 1 : board.w / board.tileW
    const rows = empty ? 1 : board.h / board.tileH
    const gl = this.#gl
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.#tilesTex)
    if (cols === this.#gridW && rows === this.#gridH) {
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        cols,
        rows,
        gl.RED_INTEGER,
        gl.UNSIGNED_SHORT,
        tiles
      )
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.R16UI,
        cols,
        rows,
        0,
        gl.RED_INTEGER,
        gl.UNSIGNED_SHORT,
        tiles
      )
      this.#gridW = cols
      this.#gridH = rows
    }
    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.useProgram(this.#pgm)
    gl.uniform2f(this.#uBoardWH, empty ? 0 : board.w, empty ? 0 : board.h)
    gl.uniform2f(
      this.#uTileWH,
      empty ? 1 : board.tileW,
      empty ? 1 : board.tileH
    )
    gl.useProgram(null)
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
