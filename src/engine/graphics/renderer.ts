import type {Pool} from '../mem/pool.ts'
import {type WH, whEq} from '../types/geo.ts'
import type {Millis} from '../types/time.ts'
import {debug} from '../utils/debug.ts'
import type {Atlas} from './atlas.ts'
import type {Cam} from './cam.ts'
import {type GL2, Shader} from './gl.ts'
import {type Sprite, spriteBytes} from './sprite.ts'
import {spriteFragGLSL} from './sprite-frag.glsl.ts'
import {spriteVertGLSL} from './sprite-vert.glsl.ts'
import {tileFragGLSL} from './tile-frag.glsl.ts'
import {tileVertGLSL} from './tile-vert.glsl.ts'
import type {LevelTiles, Tileset} from './tileset.ts'

/** @internal */
export type Context = {
  gl: GL2
  spriteShader: Shader
  tileShader: Shader
  viewport: WH
}

const uv: Readonly<Int8Array> = new Int8Array([1, 1, 0, 1, 1, 0, 0, 0])

export class Renderer {
  /** when off, ents should avoid requesting renders. */
  always: boolean = debug?.render === 'always'
  /** number of clears performed. often used to count render passes. */
  clears: number = 0
  drawStart: Millis = 0
  drawEnd: Millis = 0
  loseContext: WEBGL_lose_context | undefined
  onContextRestored: (() => void) | undefined
  readonly #atlas: Readonly<Atlas>
  #atlasImage: Readonly<HTMLImageElement> | undefined
  readonly #canvas: HTMLCanvasElement
  #clearRGBA: number = 0
  #depth: boolean = true
  #ctx: Context | undefined
  #invalid: boolean = false
  #levelTiles: Readonly<LevelTiles> | undefined
  readonly #looper: {readonly age: Millis}
  #tilesetImage: Readonly<HTMLImageElement> | undefined
  #tileset: Readonly<Tileset> | undefined

  constructor(
    atlas: Readonly<Atlas>,
    canvas: HTMLCanvasElement,
    looper: {readonly age: Millis}
  ) {
    this.#atlas = atlas
    this.#canvas = canvas
    this.#looper = looper
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
    this.clears++
  }

  drawSprites(pool: Readonly<Pool<Sprite>>): void {
    if (!this.#atlasImage || !this.#ctx) return
    const {gl, spriteShader} = this.#ctx

    gl.useProgram(spriteShader.program)

    for (const [i, tex] of spriteShader.textures.entries()) {
      gl.activeTexture(gl.TEXTURE0 + i)
      gl.bindTexture(gl.TEXTURE_2D, tex)
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, spriteShader.buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      pool.view,
      gl.DYNAMIC_DRAW,
      0,
      pool.size * spriteBytes
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

    if (debug?.render) {
      const err = gl.getError()
      if (err !== gl.NO_ERROR)
        console.error(`[render] GL error x${err.toString(16)}`)
    }

    this.#invalid = false
  }

  drawTiles(cam: Readonly<Cam>): void {
    if (!this.#tilesetImage || !this.#levelTiles || !this.#ctx) return
    const {gl, tileShader} = this.#ctx

    gl.useProgram(tileShader.program)

    gl.uniform4i(
      tileShader.uniform.uCam!,
      Math.floor(cam.x),
      Math.floor(cam.y),
      cam.w,
      cam.h
    )
    gl.uniform2i(
      tileShader.uniform.uTileWH!,
      this.#tileset?.tileWH.w ?? 0,
      this.#tileset?.tileWH.h ?? 0
    )
    gl.uniform2i(
      tileShader.uniform.uLevelWH!,
      this.#levelTiles.w,
      this.#levelTiles.h
    )
    gl.uniform2i(
      tileShader.uniform.uLevelXY!,
      this.#levelTiles.x,
      this.#levelTiles.y
    )
    gl.uniform2i(
      tileShader.uniform.uTilesetWH!,
      this.#tilesetImage.naturalWidth,
      this.#tilesetImage.naturalHeight
    )

    for (const [i, tex] of tileShader.textures.entries()) {
      gl.activeTexture(gl.TEXTURE0 + i)
      gl.bindTexture(gl.TEXTURE_2D, tex)
    }

    gl.bindVertexArray(tileShader.vao)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, uv.length / 2)
    gl.bindVertexArray(null)

    if (debug?.render) {
      const err = gl.getError()
      if (err !== gl.NO_ERROR)
        console.error(`[render] GL error x${err.toString(16)}`)
    }

    this.#invalid = false
  }

  get hasContext(): boolean {
    return this.#ctx != null
  }

  /**
   * true when context has changed since last draw and screen should be redrawn.
   */
  get invalid(): boolean {
    return this.#invalid || this.always
  }

  loadAtlas(atlas: Readonly<HTMLImageElement> | undefined): void {
    this.#atlasImage = atlas
    this.#ctx = this._Context()
  }

  loadTileset(tileset: Readonly<HTMLImageElement> | undefined): void {
    this.#tilesetImage = tileset
    if (this.#ctx) this.#uploadTiles(this.#ctx.gl, this.#ctx.tileShader)
    if (!this.#invalid && debug?.invalid)
      console.debug('[invalid] renderer invalid')
    this.#invalid = true
  }

  postdraw(): void {
    this.drawEnd = performance.now()
  }

  predraw(cam: Readonly<Cam>): void {
    this.drawStart = performance.now()
    if (!this.#ctx) return
    const {gl, spriteShader, viewport} = this.#ctx

    if (!whEq(viewport, cam)) {
      gl.viewport(0, 0, cam.w, cam.h)
      viewport.w = cam.w
      viewport.h = cam.h
    }

    gl.useProgram(spriteShader.program)

    gl.uniform4i(
      spriteShader.uniform.uCam!,
      Math.floor(cam.x),
      Math.floor(cam.y),
      cam.w,
      cam.h
    )
    gl.uniform1f(spriteShader.uniform.uAge!, this.#looper.age)

    for (const [i, tex] of spriteShader.textures.entries()) {
      gl.activeTexture(gl.TEXTURE0 + i)
      gl.bindTexture(gl.TEXTURE_2D, tex)
    }
  }

  register(op: 'add' | 'remove'): this {
    if (op === 'add' && !isWebGL2Supported())
      this.#canvas
        .getContext('2d')
        ?.fillText('WebGL 2 unsupported by browser.', 10, 10)
    this.#canvas[`${op}EventListener`]('webglcontextlost', this.#onContextLost)
    this.#canvas[`${op}EventListener`](
      'webglcontextrestored',
      this.#onContextRestored
    )
    return this
  }

  setDepth(enable: boolean): void {
    this.#depth = enable
    if (!this.#ctx) return
    if (enable) this.#ctx.gl.enable(this.#ctx.gl.DEPTH_TEST)
    else this.#ctx.gl.disable(this.#ctx.gl.DEPTH_TEST)
  }

  setTiles(
    tileset: Readonly<Tileset>,
    tiles: Readonly<LevelTiles> | undefined
  ): void {
    this.#tileset = tileset
    this.#levelTiles = tiles
    if (this.#ctx) this.#uploadTiles(this.#ctx.gl, this.#ctx.tileShader)
    if (!this.#invalid && debug?.invalid)
      console.debug('[invalid] renderer invalid')
    this.#invalid = true
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  /** @internal */
  _Context(): Context | undefined {
    const gl = this.#ctx?.gl ?? GL2(this.#canvas, this.always)
    if (!gl) return

    // force gl.clearColor() on next clear() since the new context defaults to
    // transparent black.
    this.#clearRGBA = 0

    const spriteShader = Shader(gl, spriteVertGLSL, spriteFragGLSL, [
      gl.createTexture(),
      gl.createTexture()
    ])

    const tileShader = Shader(gl, tileVertGLSL, tileFragGLSL, [
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

    this.setDepth(this.#depth)

    // enable z-buffer for [0, 1] ([foreground, background]).
    gl.depthRange(0, 1)
    gl.clearDepth(1)
    gl.depthFunc(gl.LESS)

    // disable image colorspace conversions. the default is browser dependent.
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, false)

    gl.bindVertexArray(spriteShader.vao)

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribIPointer(0, 2, gl.BYTE, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    gl.bindBuffer(gl.ARRAY_BUFFER, spriteShader.buffer)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_INT, spriteBytes, 0)
    gl.vertexAttribDivisor(1, 1)
    gl.enableVertexAttribArray(2)
    gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_INT, spriteBytes, 4)
    gl.vertexAttribDivisor(2, 1)
    gl.enableVertexAttribArray(3)
    gl.vertexAttribIPointer(3, 1, gl.UNSIGNED_INT, spriteBytes, 8)
    gl.vertexAttribDivisor(3, 1)
    gl.enableVertexAttribArray(4)
    gl.vertexAttribIPointer(4, 1, gl.UNSIGNED_INT, spriteBytes, 12)
    gl.vertexAttribDivisor(4, 1)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    gl.bindTexture(gl.TEXTURE_2D, spriteShader.textures[0]!)
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

    gl.bindTexture(gl.TEXTURE_2D, spriteShader.textures[1]!)
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

    gl.useProgram(spriteShader.program)
    gl.uniform1i(spriteShader.uniform.uTex!, 0)
    gl.uniform1i(spriteShader.uniform.uCels!, 1)
    if (this.#atlasImage)
      gl.uniform2ui(
        spriteShader.uniform.uTexWH!,
        this.#atlasImage.naturalWidth,
        this.#atlasImage.naturalHeight
      )

    gl.bindVertexArray(tileShader.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribIPointer(0, 2, gl.BYTE, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.bindVertexArray(null)

    this.#uploadTiles(gl, tileShader)

    if (!this.#invalid && debug?.invalid)
      console.debug('[invalid] renderer invalid')
    this.#invalid = true
    // keep outside of #context so it can be restored.
    this.loseContext = gl.getExtension('WEBGL_lose_context') ?? undefined
    return (this.#ctx = {
      gl,
      spriteShader,
      tileShader,
      viewport: {w: 0, h: 0}
    })
  }

  #uploadTiles(gl: GL2, shader: Shader): void {
    gl.useProgram(shader.program)

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)

    const tileW = this.#tileset?.tileWH.w || 1
    const tileH = this.#tileset?.tileWH.h || 1

    gl.bindTexture(gl.TEXTURE_2D, shader.textures[0]!)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R16UI,
      (this.#levelTiles?.w ?? 0) / tileW,
      (this.#levelTiles?.h ?? 0) / tileH,
      0,
      gl.RED_INTEGER,
      gl.UNSIGNED_SHORT,
      new Uint16Array(this.#levelTiles?.tiles ?? [])
    )
    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.bindTexture(gl.TEXTURE_2D, shader.textures[1]!)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    if (this.#tilesetImage)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        this.#tilesetImage
      )
    else
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 0])
      )
    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.uniform1i(shader.uniform.uTileset!, 0)
    gl.uniform1i(shader.uniform.uTileTex!, 1)
  }

  #onContextLost = (ev: Event): void => {
    ev.preventDefault() // required.
    console.debug('[render] GL context lost')
    this.#ctx = undefined
  }

  #onContextRestored = (): void => {
    console.debug('[render] GL context restored')
    this.#ctx = this._Context()
    this.onContextRestored?.()
  }
}

function GL2(canvas: HTMLCanvasElement, always: boolean): GL2 | undefined {
  const gl =
    canvas.getContext('webgl2', {
      // to-do: expose with Int / Frac mode.
      antialias: false,
      powerPreference: 'low-power',
      // avoid flicker caused by clearing the drawing buffer. see
      // https://developer.chrome.com/blog/desynchronized/.
      preserveDrawingBuffer: true,
      // disable desync in debug since it breaks FPS meter. only enable
      // when canvas is known to draw next frame.
      ...(!debug?.render && {desynchronized: always})
    }) ?? undefined
  if (!gl) console.debug('[render] no GL context')

  return gl
}

function isWebGL2Supported(): boolean {
  if (typeof document === 'undefined') return true // for tests.
  return document.createElement('canvas').getContext('webgl2') != null
}
