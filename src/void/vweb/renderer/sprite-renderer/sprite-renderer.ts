import {
  spriteAnimCelOffset,
  spriteStride,
  spriteWHOffset,
  spriteZOffset
} from '../../engine/layout.ts'
import {buildProgram} from '../gl.ts'
import {spriteFrag} from './sprite.frag.ts'
import {spriteVert} from './sprite.vert.ts'

export class SpriteRenderer {
  static new(
    gl: WebGL2RenderingContext,
    atlasCels: Uint16Array,
    atlasAnimCount: number,
    atlasCelsPerAnim: number,
    atlasImg: HTMLImageElement
  ): SpriteRenderer {
    const pgm = buildProgram(gl, spriteVert, spriteFrag)
    const uResolution = gl.getUniformLocation(pgm, 'uResolution')!
    const uCamXY = gl.getUniformLocation(pgm, 'uCamXY')!
    const uLayerScale = gl.getUniformLocation(pgm, 'uLayerScale')!
    const uLayerOffsetPhy = gl.getUniformLocation(pgm, 'uLayerOffsetPhy')!
    const uLayerModulo = gl.getUniformLocation(pgm, 'uLayerModulo')!
    const uRenderMode = gl.getUniformLocation(pgm, 'uRenderMode')!
    const uBlendMode = gl.getUniformLocation(pgm, 'uBlendMode')!

    gl.useProgram(pgm)

    gl.uniform1i(gl.getUniformLocation(pgm, 'uAtlasCels'), 0)
    gl.uniform1i(gl.getUniformLocation(pgm, 'uSpritesheet'), 1)

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

    const spritesheetTex = gl.createTexture()!
    gl.activeTexture(gl.TEXTURE1)
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
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, spriteStride, 0)
    gl.vertexAttribDivisor(0, 1)

    // aAnimCel (uint16): hi 12 bits = AnimID, lo 4 bits = Cel.
    gl.enableVertexAttribArray(1)
    gl.vertexAttribIPointer(
      1,
      1,
      gl.UNSIGNED_SHORT,
      spriteStride,
      spriteAnimCelOffset
    )
    gl.vertexAttribDivisor(1, 1)

    // aZ as uint8.
    gl.enableVertexAttribArray(2)
    gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_BYTE, spriteStride, spriteZOffset)
    gl.vertexAttribDivisor(2, 1)

    // aWH (uvec2 of uint16).
    gl.enableVertexAttribArray(3)
    gl.vertexAttribIPointer(
      3,
      2,
      gl.UNSIGNED_SHORT,
      spriteStride,
      spriteWHOffset
    )
    gl.vertexAttribDivisor(3, 1)

    gl.bindVertexArray(null)

    return new SpriteRenderer(
      gl,
      pgm,
      uResolution,
      uCamXY,
      uLayerScale,
      uLayerOffsetPhy,
      uLayerModulo,
      uRenderMode,
      uBlendMode,
      vao,
      instanceVBO,
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
  readonly #uBlendMode: WebGLUniformLocation
  readonly #vao: WebGLVertexArrayObject
  readonly #instanceVBO: WebGLBuffer
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
    uBlendMode: WebGLUniformLocation,
    vao: WebGLVertexArrayObject,
    instanceVBO: WebGLBuffer,
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
    this.#uBlendMode = uBlendMode
    this.#vao = vao
    this.#instanceVBO = instanceVBO
    this.#atlasCelsTex = atlasCelsTex
    this.#spritesheetTex = spritesheetTex
  }

  dispose(): void {
    const gl = this.#gl
    gl.deleteProgram(this.#pgm)
    gl.deleteVertexArray(this.#vao)
    gl.deleteBuffer(this.#instanceVBO)
    gl.deleteTexture(this.#atlasCelsTex)
    gl.deleteTexture(this.#spritesheetTex)
  }

  draw(
    buffer: ArrayBuffer,
    spritePtr: number,
    count: number,
    camX: number,
    camY: number,
    layerScale: number,
    clipPhy: {x: number; y: number; w: number; h: number},
    layerModulo: number,
    renderMode: number,
    blendMode: number
  ): void {
    if (!count) return
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
    gl.uniform1i(this.#uBlendMode, blendMode)
    gl.uniform2i(
      this.#uResolution,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
    )

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.#atlasCelsTex)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.#spritesheetTex)

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
