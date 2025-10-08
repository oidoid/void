import type {Pool} from '../mem/pool.ts'
import {type WH, whEq} from '../types/geo.ts'
import type {Millis} from '../types/time.ts'
import {debug} from '../utils/debug.ts'
import type {Atlas, TagFormat} from './atlas.ts'
import type {Cam} from './cam.ts'
import {type GL2, Shader} from './gl.ts'
import {drawableBytes, type Sprite} from './sprite.ts'
import {spriteFragGLSL} from './sprite-frag.glsl.ts'
import {spriteVertGLSL} from './sprite-vert.glsl.ts'

type Context = {gl: GL2; spriteShader: Shader; viewport: WH}

const uv: Readonly<Int8Array> = new Int8Array([1, 1, 0, 1, 1, 0, 0, 0])

export class Renderer {
  /** when off, ents should avoid requesting renders. */
  always: boolean = false
  invalid: boolean = false
  loseContext: WEBGL_lose_context | undefined
  readonly #atlas: Readonly<Atlas>
  #atlasImage?: Readonly<HTMLImageElement>
  readonly #canvas: HTMLCanvasElement
  #clearRGBA: number = 0
  #ctx: Context | undefined

  constructor(atlas: Readonly<Atlas>, canvas: HTMLCanvasElement) {
    this.#atlas = atlas
    this.#canvas = canvas
    this.#ctx = this.#Context()
  }

  clear(rgba: number): void {
    if (!this.#ctx) return
    const {gl} = this.#ctx
    if (this.#clearRGBA !== rgba) {
      this.#clearRGBA = rgba
      gl.clearColor(
        ((rgba >>> 24) & 0xff) / 0xff,
        ((rgba >>> 16) & 0xff) / 0xff,
        ((rgba >>> 8) & 0xff) / 0xff,
        ((rgba >>> 0) & 0xff) / 0xff
      )
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }

  draw(pool: Readonly<Pool<Sprite<TagFormat>>>): void {
    if (!this.#atlasImage || !this.#ctx) return
    const {gl, spriteShader} = this.#ctx

    gl.bindBuffer(gl.ARRAY_BUFFER, spriteShader.buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      pool.view,
      gl.DYNAMIC_DRAW,
      0,
      pool.size * drawableBytes
    )
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    gl.bindVertexArray(spriteShader.vao)
    gl.drawArraysInstanced(
      gl.TRIANGLE_STRIP,
      0,
      uv.length / 2, // d
      pool.size
    )
    gl.bindVertexArray(null)

    this.invalid = false
  }

  load(atlas: Readonly<HTMLImageElement>): void {
    this.#atlasImage = atlas
    this.#ctx = this.#Context()
  }

  predraw(cam: Readonly<Cam>, framer: {readonly age: Millis}): void {
    if (!this.#ctx) return
    const {gl, spriteShader, viewport} = this.#ctx

    if (!whEq(viewport, cam)) {
      gl.viewport(0, 0, cam.w, cam.h)
      viewport.w = cam.w
      viewport.h = cam.h
    }

    gl.useProgram(spriteShader.program)

    gl.uniform4i(spriteShader.uniform.uCam!, cam.x, cam.y, cam.w, cam.h)
    gl.uniform1f(spriteShader.uniform.uAge!, framer.age)

    for (const [i, tex] of spriteShader.textures.entries()) {
      gl.activeTexture(gl.TEXTURE0 + i)
      gl.bindTexture(gl.TEXTURE_2D, tex)
    }
  }

  register(op: 'add' | 'remove'): this {
    this.#canvas[`${op}EventListener`]('webglcontextlost', this.#onContextLost)
    this.#canvas[`${op}EventListener`](
      'webglcontextrestored',
      this.#onContextRestored
    )
    return this
  }

  setDepth(enable: boolean): void {
    if (!this.#ctx) return
    if (enable) this.#ctx.gl.enable(this.#ctx.gl.DEPTH_TEST)
    else this.#ctx.gl.disable(this.#ctx.gl.DEPTH_TEST)
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #Context(): Context | undefined {
    const gl = this.#ctx?.gl ?? GL2(this.#canvas)
    if (!gl) return

    const shader = Shader(gl, spriteVertGLSL, spriteFragGLSL, [
      gl.createTexture(),
      gl.createTexture()
    ])

    // allow translucent textures to be layered.
    gl.enable(gl.BLEND)
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA
    )

    // enable z-buffer for [0, 1] ([foreground, background]).
    gl.depthRange(0, 1)
    gl.clearDepth(1)
    gl.depthFunc(gl.LESS)

    // disable image colorspace conversions. the default is browser dependent.
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, false)

    gl.bindVertexArray(shader.vao)

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribIPointer(0, 2, gl.BYTE, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    gl.bindBuffer(gl.ARRAY_BUFFER, shader.buffer)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_INT, drawableBytes, 0)
    gl.vertexAttribDivisor(1, 1)
    gl.enableVertexAttribArray(2)
    gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_INT, drawableBytes, 4)
    gl.vertexAttribDivisor(2, 1)
    gl.enableVertexAttribArray(3)
    gl.vertexAttribIPointer(3, 1, gl.UNSIGNED_INT, drawableBytes, 8)
    gl.vertexAttribDivisor(3, 1)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    gl.bindTexture(gl.TEXTURE_2D, shader.textures[0]!)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    if (this.#atlasImage)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        this.#atlasImage
      )
    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.bindTexture(gl.TEXTURE_2D, shader.textures[1]!)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA16UI, // source XYWH cannot be > 65535.
      1,
      this.#atlas.celXYWH.length / 4, // 4 u16s per row
      0,
      gl.RGBA_INTEGER,
      gl.UNSIGNED_SHORT,
      new Uint16Array(this.#atlas.celXYWH)
    )
    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.bindVertexArray(null)

    gl.uniform1i(shader.uniform.uTex!, 0)
    gl.uniform1i(shader.uniform.uCels!, 1)
    if (this.#atlasImage)
      gl.uniform2ui(
        shader.uniform.uTexWH!,
        this.#atlasImage.naturalWidth,
        this.#atlasImage.naturalHeight
      )

    this.invalid = true
    // keep outside of #context so it can be restored.
    this.loseContext = gl.getExtension('WEBGL_lose_context') ?? undefined
    return (this.#ctx = {gl, spriteShader: shader, viewport: {w: 0, h: 0}})
  }

  #onContextLost = (ev: Event): void => {
    ev.preventDefault() // required.
    console.debug('[render] WebGL context lost')
    this.#ctx = undefined
  }

  #onContextRestored = (): void => {
    console.debug('[render] WebGL context restored')
    this.#ctx = this.#Context()
  }
}

function GL2(canvas: HTMLCanvasElement): GL2 | undefined {
  const gl = canvas.getContext('webgl2', {
    // to-do: expose.
    antialias: false,
    powerPreference: 'low-power',
    // avoid flicker caused by clearing the drawing buffer. see
    // https://developer.chrome.com/blog/desynchronized/.
    preserveDrawingBuffer: true,
    ...(!debug?.render && {desynchronized: true})
  })
  if (!gl) {
    console.debug('[render] no GL context')
    return
  }

  if (debug?.render && !gl.getContextAttributes()?.desynchronized)
    console.debug('[render] no WebGL DOM desynchronization')

  return gl
}
