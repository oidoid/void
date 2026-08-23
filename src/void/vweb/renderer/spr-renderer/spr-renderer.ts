import {
  sprAnimCelOffset,
  sprFlagsOffset,
  sprStride,
  sprWHOffset,
  sprZOffset
} from '../../engine/layout.ts'
import {buildProgram} from '../gl.ts'
import {sprFrag} from './spr.frag.glsl.ts'
import {sprVert} from './spr.vert.glsl.ts'

export class SprRenderer {
  static new(
    gl: WebGL2RenderingContext,
    atlasCels: Uint16Array,
    atlasAnimCount: number,
    atlasCelsPerAnim: number,
    atlasImg: HTMLImageElement,
    pixel: boolean
  ): SprRenderer {
    const pgm = buildProgram(gl, sprVert, sprFrag)
    const uResolution = gl.getUniformLocation(pgm, 'uResolution')!
    const uCamXY = gl.getUniformLocation(pgm, 'uCamXY')!
    const uNowMillis = gl.getUniformLocation(pgm, 'uNowMillis')!
    const uBlendMode = gl.getUniformLocation(pgm, 'uBlendMode')!

    gl.useProgram(pgm)

    gl.uniform1i(gl.getUniformLocation(pgm, 'uAtlasCels'), 0)
    gl.uniform1i(gl.getUniformLocation(pgm, 'uSprsheet'), 1)
    gl.uniform1i(gl.getUniformLocation(pgm, 'uPixel')!, pixel ? 1 : 0)

    const atlasCelsTex = gl.createTexture()!
    gl.activeTexture(gl.TEXTURE0)
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

    const filter = pixel ? gl.NEAREST : gl.LINEAR

    const sprsheetTex = gl.createTexture()!
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, sprsheetTex)
    // pal-swappable source texels store a pal slot in their red byte. sRGB
    // conversion would turn 1/255 into 0.
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      atlasImg
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
    gl.uniform2f(
      gl.getUniformLocation(pgm, 'uAtlasSize')!,
      atlasImg.naturalWidth,
      atlasImg.naturalHeight
    )

    gl.useProgram(null)

    const instanceVBO = gl.createBuffer()!

    const vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)

    gl.bindBuffer(gl.ARRAY_BUFFER, instanceVBO)

    // aXY.
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, sprStride, 0)
    gl.vertexAttribDivisor(0, 1)

    // aAnimCel (uint16): hi 12 bits = AnimID, lo 4 bits = Cel.
    gl.enableVertexAttribArray(1)
    gl.vertexAttribIPointer(
      1,
      1,
      gl.UNSIGNED_SHORT,
      sprStride,
      sprAnimCelOffset
    )
    gl.vertexAttribDivisor(1, 1)

    // aZ as uint8.
    gl.enableVertexAttribArray(2)
    gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_BYTE, sprStride, sprZOffset)
    gl.vertexAttribDivisor(2, 1)

    // aWH (uvec2 of uint16): destination size; zero uses source cel size.
    gl.enableVertexAttribArray(3)
    gl.vertexAttribIPointer(3, 2, gl.UNSIGNED_SHORT, sprStride, sprWHOffset)
    gl.vertexAttribDivisor(3, 1)

    // aFlags as uint32.
    gl.enableVertexAttribArray(4)
    gl.vertexAttribIPointer(4, 1, gl.UNSIGNED_INT, sprStride, sprFlagsOffset)
    gl.vertexAttribDivisor(4, 1)

    gl.bindVertexArray(null)

    return new SprRenderer(
      gl,
      pgm,
      uResolution,
      uCamXY,
      uNowMillis,
      uBlendMode,
      vao,
      instanceVBO,
      atlasCelsTex,
      sprsheetTex
    )
  }

  readonly #gl: WebGL2RenderingContext
  readonly #pgm: WebGLProgram
  readonly #uResolution: WebGLUniformLocation
  readonly #uCamXY: WebGLUniformLocation
  readonly #uNowMillis: WebGLUniformLocation
  readonly #uBlendMode: WebGLUniformLocation
  readonly #vao: WebGLVertexArrayObject
  readonly #instanceVBO: WebGLBuffer
  readonly #atlasCelsTex: WebGLTexture
  readonly #sprsheetTex: WebGLTexture

  private constructor(
    gl: WebGL2RenderingContext,
    pgm: WebGLProgram,
    uResolution: WebGLUniformLocation,
    uCamXY: WebGLUniformLocation,
    uNowMillis: WebGLUniformLocation,
    uBlendMode: WebGLUniformLocation,
    vao: WebGLVertexArrayObject,
    instanceVBO: WebGLBuffer,
    atlasCelsTex: WebGLTexture,
    sprsheetTex: WebGLTexture
  ) {
    this.#gl = gl
    this.#pgm = pgm
    this.#uResolution = uResolution
    this.#uCamXY = uCamXY
    this.#uNowMillis = uNowMillis
    this.#uBlendMode = uBlendMode
    this.#vao = vao
    this.#instanceVBO = instanceVBO
    this.#atlasCelsTex = atlasCelsTex
    this.#sprsheetTex = sprsheetTex
  }

  get sprsheetTex(): WebGLTexture {
    return this.#sprsheetTex
  }

  get atlasCelsTex(): WebGLTexture {
    return this.#atlasCelsTex
  }

  dispose(): void {
    const gl = this.#gl
    gl.deleteProgram(this.#pgm)
    gl.deleteVertexArray(this.#vao)
    gl.deleteBuffer(this.#instanceVBO)
    gl.deleteTexture(this.#atlasCelsTex)
    gl.deleteTexture(this.#sprsheetTex)
  }

  draw(
    buffer: ArrayBuffer,
    sprPtr: number,
    count: number,
    nowMillis: number,
    camX: number,
    camY: number,
    blendMode: number,
    resolutionW: number,
    resolutionH: number
  ): void {
    if (!count) return
    const gl = this.#gl
    gl.useProgram(this.#pgm)
    gl.uniform1f(this.#uNowMillis, nowMillis)
    gl.uniform2f(this.#uCamXY, camX, camY)
    gl.uniform1i(this.#uBlendMode, blendMode)
    gl.uniform2i(this.#uResolution, resolutionW, resolutionH)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.#atlasCelsTex)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.#sprsheetTex)

    const bytes = new Uint8Array(buffer, sprPtr, count * sprStride)
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
