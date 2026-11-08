import {
  sprCelOffset,
  sprFlagsOffset,
  sprStride,
  sprTagOffset,
  sprWHOffset,
  sprZOffset
} from '../../eng/bridge.ts'
import {buildProgram} from '../gl.ts'
import sprFrag from './spr.frag.glsl' with {type: 'text'}
import sprVert from './spr.vert.glsl' with {type: 'text'}

/** grows and never shrinks. */
type LayerInstanceBuffer = {
  vao: WebGLVertexArrayObject
  vbo: WebGLBuffer
  /** allocated bytes. */
  bytes: number
}

export class SprRenderer {
  static new(
    gl: WebGL2RenderingContext,
    atlasTexels: Uint16Array,
    atlasImg: HTMLImageElement,
    pixel: boolean
  ): SprRenderer {
    const pgm = buildProgram(gl, sprVert, sprFrag)
    const uResolution = gl.getUniformLocation(pgm, 'uResolution')!
    const uCamXY = gl.getUniformLocation(pgm, 'uCamXY')!
    const uBlendMode = gl.getUniformLocation(pgm, 'uBlendMode')!

    gl.useProgram(pgm)

    gl.uniform1i(gl.getUniformLocation(pgm, 'uAtlas'), 0)
    gl.uniform1i(gl.getUniformLocation(pgm, 'uSprsheet'), 1)
    gl.uniform1i(gl.getUniformLocation(pgm, 'uPixel')!, pixel ? 1 : 0)

    const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
    const count = Math.max(1, atlasTexels.length / 4)
    const w = Math.min(count, maxSize)
    const h = Math.ceil(count / w)
    if (h > maxSize) throw Error('atlas lookup exceeds texture limits')
    let texels = atlasTexels
    if (texels.length !== w * h * 4) {
      texels = new Uint16Array(w * h * 4)
      texels.set(atlasTexels)
    }
    const atlasTex = gl.createTexture()!
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, atlasTex)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA16UI,
      w,
      h,
      0,
      gl.RGBA_INTEGER,
      gl.UNSIGNED_SHORT,
      texels
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

    return new SprRenderer(
      gl,
      pgm,
      uResolution,
      uCamXY,
      uBlendMode,
      atlasTex,
      sprsheetTex
    )
  }

  readonly #gl: WebGL2RenderingContext
  readonly #pgm: WebGLProgram
  readonly #uResolution: WebGLUniformLocation
  readonly #uCamXY: WebGLUniformLocation
  readonly #uBlendMode: WebGLUniformLocation
  readonly #atlasTex: WebGLTexture
  readonly #sprsheetTex: WebGLTexture
  /** by layer. */
  readonly #instances: (LayerInstanceBuffer | undefined)[] = []

  private constructor(
    gl: WebGL2RenderingContext,
    pgm: WebGLProgram,
    uResolution: WebGLUniformLocation,
    uCamXY: WebGLUniformLocation,
    uBlendMode: WebGLUniformLocation,
    atlasTex: WebGLTexture,
    sprsheetTex: WebGLTexture
  ) {
    this.#gl = gl
    this.#pgm = pgm
    this.#uResolution = uResolution
    this.#uCamXY = uCamXY
    this.#uBlendMode = uBlendMode
    this.#atlasTex = atlasTex
    this.#sprsheetTex = sprsheetTex
  }

  get sprsheetTex(): WebGLTexture {
    return this.#sprsheetTex
  }

  get atlasTex(): WebGLTexture {
    return this.#atlasTex
  }

  dispose(): void {
    const gl = this.#gl
    gl.deleteProgram(this.#pgm)
    for (const instances of this.#instances) {
      if (!instances) continue
      gl.deleteVertexArray(instances.vao)
      gl.deleteBuffer(instances.vbo)
    }
    gl.deleteTexture(this.#atlasTex)
    gl.deleteTexture(this.#sprsheetTex)
  }

  draw(
    layer: number,
    buffer: ArrayBuffer,
    sprPtr: number,
    count: number,
    camX: number,
    camY: number,
    blendMode: number,
    resolutionW: number,
    resolutionH: number
  ): void {
    if (!count) return
    const gl = this.#gl
    gl.useProgram(this.#pgm)
    gl.uniform2f(this.#uCamXY, camX, camY)
    gl.uniform1i(this.#uBlendMode, blendMode)
    gl.uniform2i(this.#uResolution, resolutionW, resolutionH)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.#atlasTex)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.#sprsheetTex)

    const instances = (this.#instances[layer] ??= newInstances(gl))
    const bytes = new Uint8Array(buffer, sprPtr, count * sprStride)
    gl.bindBuffer(gl.ARRAY_BUFFER, instances.vbo)
    if (bytes.byteLength > instances.bytes) {
      instances.bytes = Math.max(bytes.byteLength, 2 * instances.bytes)
      gl.bufferData(gl.ARRAY_BUFFER, instances.bytes, gl.DYNAMIC_DRAW)
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, bytes)
    gl.bindVertexArray(instances.vao)
    gl.drawArraysInstanced(
      gl.TRIANGLES,
      0,
      6, // quad.
      count
    )
    gl.bindVertexArray(null)
  }
}

function newInstances(gl: WebGL2RenderingContext): LayerInstanceBuffer {
  const vbo = gl.createBuffer()!
  const vao = gl.createVertexArray()!
  gl.bindVertexArray(vao)
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)

  // aXY.
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, sprStride, 0)
  gl.vertexAttribDivisor(0, 1)

  // aTag: 12b atlas ID in a uint16 field.
  gl.enableVertexAttribArray(1)
  gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_SHORT, sprStride, sprTagOffset)
  gl.vertexAttribDivisor(1, 1)

  // aCel (uint8): authored frame within the tag.
  gl.enableVertexAttribArray(2)
  gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_BYTE, sprStride, sprCelOffset)
  gl.vertexAttribDivisor(2, 1)

  // aZ (uint8): layer and sublayer.
  gl.enableVertexAttribArray(5)
  gl.vertexAttribIPointer(5, 1, gl.UNSIGNED_BYTE, sprStride, sprZOffset)
  gl.vertexAttribDivisor(5, 1)

  // aWH (uvec2 of uint16): destination size; zero uses source cel size.
  gl.enableVertexAttribArray(3)
  gl.vertexAttribIPointer(3, 2, gl.UNSIGNED_SHORT, sprStride, sprWHOffset)
  gl.vertexAttribDivisor(3, 1)

  // aFlags as uint32.
  gl.enableVertexAttribArray(4)
  gl.vertexAttribIPointer(4, 1, gl.UNSIGNED_INT, sprStride, sprFlagsOffset)
  gl.vertexAttribDivisor(4, 1)

  gl.bindVertexArray(null)
  return {vao, vbo, bytes: 0}
}
