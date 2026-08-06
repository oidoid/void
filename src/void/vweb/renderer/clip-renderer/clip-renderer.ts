import type {XYWH} from '../../geo/box.ts'
import {buildProgram} from '../gl.ts'
import {clipFrag} from './clip.frag.glsl.ts'
import {clipVert} from './clip.vert.glsl.ts'

const layerBlendModeAlpha: number = 0
const layerBlendModeMultiply: number = 1
const layerBlendModeReplace: number = 2

export type ClipTarget = {
  phy: XYWH
  w: number // framebuffer dimensions in layer pixels.
  h: number
}

export class ClipRenderer {
  static new(gl: WebGL2RenderingContext): ClipRenderer {
    const pgm = buildProgram(gl, clipVert, clipFrag)
    const uResolution = gl.getUniformLocation(pgm, 'uResolution')!
    const uDstXYWH = gl.getUniformLocation(pgm, 'uDstXYWH')!
    const uTex = gl.getUniformLocation(pgm, 'uTex')!
    const uDiscardTransparent = gl.getUniformLocation(
      pgm,
      'uDiscardTransparent'
    )!
    const vao = gl.createVertexArray()!
    const colorTex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, colorTex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.bindTexture(gl.TEXTURE_2D, null)
    return new ClipRenderer(
      gl,
      pgm,
      uResolution,
      uDstXYWH,
      uTex,
      uDiscardTransparent,
      vao,
      gl.createFramebuffer()!,
      colorTex,
      gl.createRenderbuffer()!
    )
  }

  readonly #gl: WebGL2RenderingContext
  readonly #pgm: WebGLProgram
  readonly #uResolution: WebGLUniformLocation
  readonly #uDstXYWH: WebGLUniformLocation
  readonly #uTex: WebGLUniformLocation
  readonly #uDiscardTransparent: WebGLUniformLocation
  readonly #vao: WebGLVertexArrayObject
  readonly #framebuffer: WebGLFramebuffer
  readonly #colorTex: WebGLTexture
  readonly #depthBuffer: WebGLRenderbuffer
  #w: number = 0
  #h: number = 0

  private constructor(
    gl: WebGL2RenderingContext,
    pgm: WebGLProgram,
    uResolution: WebGLUniformLocation,
    uDstXYWH: WebGLUniformLocation,
    uTex: WebGLUniformLocation,
    uDiscardTransparent: WebGLUniformLocation,
    vao: WebGLVertexArrayObject,
    framebuffer: WebGLFramebuffer,
    colorTex: WebGLTexture,
    depthBuffer: WebGLRenderbuffer
  ) {
    this.#gl = gl
    this.#pgm = pgm
    this.#uResolution = uResolution
    this.#uDstXYWH = uDstXYWH
    this.#uTex = uTex
    this.#uDiscardTransparent = uDiscardTransparent
    this.#vao = vao
    this.#framebuffer = framebuffer
    this.#colorTex = colorTex
    this.#depthBuffer = depthBuffer
  }

  begin(
    layerScale: number,
    blendMode: number,
    depth: boolean,
    clipPhy: Readonly<XYWH>
  ): ClipTarget | undefined {
    if (
      !clipPhy.w ||
      !clipPhy.h ||
      (clipPhy.w === this.#gl.drawingBufferWidth &&
        clipPhy.h === this.#gl.drawingBufferHeight)
    )
      return
    const w = Math.ceil(clipPhy.w / layerScale)
    const h = Math.ceil(clipPhy.h / layerScale)
    this.#resize(w, h)
    this.#gl.bindFramebuffer(this.#gl.FRAMEBUFFER, this.#framebuffer)
    this.#gl.viewport(0, 0, w, h)
    this.#clear(blendMode)
    this.#setSourceBlend(blendMode, true)
    this.#setDepth(depth)
    return {phy: clipPhy, w, h}
  }

  end(clip: ClipTarget, blendMode: number): void {
    const gl = this.#gl
    gl.disable(gl.DEPTH_TEST)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    this.#setCompositeBlend(blendMode)

    gl.useProgram(this.#pgm)
    gl.uniform2i(
      this.#uResolution,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
    )
    gl.uniform4f(this.#uDstXYWH, clip.phy.x, clip.phy.y, clip.phy.w, clip.phy.h)
    gl.uniform1i(this.#uTex, 0)
    gl.uniform1i(
      this.#uDiscardTransparent,
      blendMode === layerBlendModeReplace ? 1 : 0
    )
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.#colorTex)
    gl.bindVertexArray(this.#vao)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.bindVertexArray(null)
    gl.bindTexture(gl.TEXTURE_2D, null)
    this.#setSourceBlend(layerBlendModeAlpha, false)
    gl.enable(gl.DEPTH_TEST)
  }

  dispose(): void {
    this.#gl.deleteProgram(this.#pgm)
    this.#gl.deleteVertexArray(this.#vao)
    this.#gl.deleteFramebuffer(this.#framebuffer)
    this.#gl.deleteTexture(this.#colorTex)
    this.#gl.deleteRenderbuffer(this.#depthBuffer)
  }

  #resize(w: number, h: number): void {
    if (w === this.#w && h === this.#h) return
    this.#w = w
    this.#h = h
    const gl = this.#gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer)
    gl.bindTexture(gl.TEXTURE_2D, this.#colorTex)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      w,
      h,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    )
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.#colorTex,
      0
    )
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.#depthBuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h)
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      this.#depthBuffer
    )
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)
    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  #clear(blendMode: number): void {
    const gl = this.#gl
    if (blendMode === layerBlendModeMultiply) gl.clearColor(1, 1, 1, 1)
    else gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }

  #setSourceBlend(blendMode: number, premulAlpha: boolean): void {
    const gl = this.#gl
    if (blendMode === layerBlendModeMultiply)
      gl.blendFunc(gl.DST_COLOR, gl.ZERO)
    else if (blendMode === layerBlendModeReplace) gl.blendFunc(gl.ONE, gl.ZERO)
    else if (premulAlpha)
      gl.blendFuncSeparate(
        gl.SRC_ALPHA,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
      )
    else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  }

  #setCompositeBlend(blendMode: number): void {
    const gl = this.#gl
    if (blendMode === layerBlendModeMultiply)
      gl.blendFunc(gl.DST_COLOR, gl.ZERO)
    else if (blendMode === layerBlendModeReplace) gl.blendFunc(gl.ONE, gl.ZERO)
    else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  }

  #setDepth(depth: boolean): void {
    if (depth) this.#gl.enable(this.#gl.DEPTH_TEST)
    else this.#gl.disable(this.#gl.DEPTH_TEST)
  }
}
