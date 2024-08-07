import type {Atlas} from '../graphics/atlas.js'
import type {AttribBuffer} from './attrib-buffer.js'
import type {Cam} from './cam.js'
import {fragGLSL} from './frag.glsl.js'
import {type GL, Shader} from './shader.js'
import {spriteVertGLSL} from './sprite-vert.glsl.js'
import {tileVertGLSL} from './tile-vert.glsl.js'

const uv: Readonly<Int8Array> = new Int8Array([1, 1, 0, 1, 1, 0, 0, 0]) // texcoords

export class Renderer {
  readonly #atlasImage: HTMLImageElement
  readonly #canvas: HTMLCanvasElement
  #clearColor: number = 0x000000ff // rgba
  readonly #cels: Readonly<Uint16Array>
  #gl?: GL
  #loseContext: WEBGL_lose_context | null = null
  #spriteShader: Shader | undefined
  #tileShader: Shader | undefined
  readonly #tilesetImage: HTMLImageElement | undefined

  constructor(
    atlas: Atlas<unknown>,
    atlasImage: HTMLImageElement,
    canvas: HTMLCanvasElement,
    tileset: HTMLImageElement | undefined
  ) {
    this.#atlasImage = atlasImage
    this.#canvas = canvas
    this.#cels = new Uint16Array(atlas.cels)
    this.#tilesetImage = tileset
  }

  clearColor(rgba: number): void {
    this.#clearColor = rgba
    this.#gl?.clearColor(
      ((rgba >>> 24) & 0xff) / 0xff,
      ((rgba >>> 16) & 0xff) / 0xff,
      ((rgba >>> 8) & 0xff) / 0xff,
      ((rgba >>> 0) & 0xff) / 0xff
    )
  }

  initGL(): void {
    if (this.hasContext()) return
    const gl = this.#canvas.getContext('webgl2', {
      antialias: false,
      powerPreference: 'high-performance'
    })
    if (!gl) throw Error('WebGL v2 unsupported')
    this.#gl = gl

    this.clearColor(this.#clearColor)

    // allow transparent textures to be layered.
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // enable z-buffer for [0, 1] ([foreground, background]).
    gl.enable(gl.DEPTH_TEST)
    gl.depthRange(0, 1)
    gl.clearDepth(1)
    gl.depthFunc(gl.LESS)

    // disable image colorspace conversions. the default is browser dependent.
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, false)

    this.#loseContext = gl.getExtension('WEBGL_lose_context')
    this.#spriteShader = SpriteShader(gl, this.#atlasImage, this.#cels)
    this.#tileShader = this.#tilesetImage
      ? TileShader(gl, this.#tilesetImage)
      : undefined
  }

  get loseContext(): WEBGL_lose_context | null {
    return this.#loseContext
  }

  hasContext(): boolean {
    return this.#gl != null && !this.#gl.isContextLost()
  }

  render(
    cam: Readonly<Cam>,
    frame: number,
    bmps: Readonly<AttribBuffer>,
    tiles: Readonly<AttribBuffer>
  ): void {
    if (!this.#gl || !this.#spriteShader) throw Error('no GL context')
    this.#resize(cam)
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT)

    this.#gl.useProgram(this.#spriteShader.pgm)

    for (const [i, tex] of this.#spriteShader.tex.entries()) {
      this.#gl.activeTexture(this.#gl.TEXTURE0 + i)
      this.#gl.bindTexture(this.#gl.TEXTURE_2D, tex)
    }

    this.#gl.uniform1i(this.#spriteShader.uniforms.uTex!, 0)
    this.#gl.uniform1i(this.#spriteShader.uniforms.uCels!, 1)
    this.#gl.uniform2ui(
      this.#spriteShader.uniforms.uTexWH!,
      this.#atlasImage.naturalWidth,
      this.#atlasImage.naturalHeight
    )
    this.#gl.uniform4i(
      this.#spriteShader.uniforms.uCam!,
      cam.x,
      cam.y,
      cam.w,
      cam.h
    )
    this.#gl.uniform1ui(this.#spriteShader.uniforms.uFrame!, frame)

    this.#gl.bindVertexArray(this.#spriteShader.vao)

    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#spriteShader.buf)
    this.#gl.bufferData(
      this.#gl.ARRAY_BUFFER,
      bmps.buffer,
      this.#gl.DYNAMIC_DRAW
    )
    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, null)

    this.#gl.drawArraysInstanced(
      this.#gl.TRIANGLE_STRIP,
      0,
      uv.length / 2, // d
      bmps.size
    )

    this.#gl.bindVertexArray(null)

    if (!this.#tileShader) return

    this.#gl.useProgram(this.#tileShader.pgm)

    for (const [i, tex] of this.#tileShader.tex.entries()) {
      this.#gl.activeTexture(this.#gl.TEXTURE0 + i)
      this.#gl.bindTexture(this.#gl.TEXTURE_2D, tex)
    }

    this.#gl.uniform1i(this.#tileShader.uniforms.uTex!, 0)
    this.#gl.uniform2ui(
      this.#tileShader.uniforms.uTexWH!,
      this.#tilesetImage!.naturalWidth,
      this.#tilesetImage!.naturalHeight
    )
    this.#gl.uniform4i(
      this.#tileShader.uniforms.uCam!,
      cam.x,
      cam.y,
      cam.w,
      cam.h
    )
    this.#gl.uniform1ui(this.#tileShader.uniforms.uTileSide!, 8) // to-do: fix me. pass size.

    this.#gl.bindVertexArray(this.#tileShader.vao)

    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#tileShader.buf)
    this.#gl.bufferData(
      this.#gl.ARRAY_BUFFER,
      tiles.buffer,
      this.#gl.DYNAMIC_DRAW
    )
    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, null)

    this.#gl.drawArraysInstanced(
      this.#gl.TRIANGLE_STRIP,
      0,
      uv.length / 2, // d
      tiles.size
    )

    this.#gl.bindVertexArray(null)
  }

  #resize(cam: Readonly<Cam>): void {
    const canvas = this.#canvas

    if (canvas.width !== cam.w || canvas.height !== cam.h) {
      canvas.width = cam.w
      canvas.height = cam.h
      this.#gl!.viewport(0, 0, cam.w, cam.h)
    }

    // these pixels may be greater than, less than, or equal to cam. ratio
    // may change independent of canvas size.
    const clientW = (cam.w * cam.scale) / devicePixelRatio
    const clientH = (cam.h * cam.scale) / devicePixelRatio
    const dw = Number.parseFloat(canvas.style.width.slice(0, -2)) - clientW
    const dh = Number.parseFloat(canvas.style.height.slice(0, -2)) - clientH
    if (
      !Number.isFinite(dw) ||
      Math.abs(dw) > 0.1 ||
      !Number.isFinite(dh) ||
      Math.abs(dh) > 0.1
    ) {
      canvas.style.width = `${clientW}px`
      canvas.style.height = `${clientH}px`
    }
  }
}

function SpriteShader(
  gl: GL,
  atlasImage: HTMLImageElement,
  cels: Readonly<Uint16Array>
): Shader {
  const tex = [gl.createTexture(), gl.createTexture()]
  const shader = Shader(gl, spriteVertGLSL, fragGLSL, tex)

  gl.bindVertexArray(shader.vao)

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.enableVertexAttribArray(0)
  gl.vertexAttribIPointer(0, 2, gl.BYTE, 0, 0)
  gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  gl.bindBuffer(gl.ARRAY_BUFFER, shader.buf)
  gl.enableVertexAttribArray(1)
  gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_INT, 12, 0)
  gl.vertexAttribDivisor(1, 1)
  gl.enableVertexAttribArray(2)
  gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_INT, 12, 4)
  gl.vertexAttribDivisor(2, 1)
  gl.enableVertexAttribArray(3)
  gl.vertexAttribIPointer(3, 1, gl.UNSIGNED_INT, 12, 8)
  gl.vertexAttribDivisor(3, 1)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  gl.bindVertexArray(null)

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, shader.tex[0]!)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    atlasImage
  )
  gl.bindTexture(gl.TEXTURE_2D, null)

  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, shader.tex[1]!)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA16UI,
    1,
    cels.length / 4, // 4 u8s per row
    0,
    gl.RGBA_INTEGER,
    gl.UNSIGNED_SHORT,
    cels
  )
  gl.bindTexture(gl.TEXTURE_2D, null)

  return shader
}

function TileShader(gl: GL, tilesetImage: HTMLImageElement): Shader {
  const tex = [gl.createTexture()]
  const shader = Shader(gl, tileVertGLSL, fragGLSL, tex)

  gl.bindVertexArray(shader.vao)

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.enableVertexAttribArray(0)
  gl.vertexAttribIPointer(0, 2, gl.BYTE, 0, 0)
  gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  gl.bindBuffer(gl.ARRAY_BUFFER, shader.buf)
  gl.enableVertexAttribArray(1)
  gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_SHORT, 2, 0)
  gl.vertexAttribDivisor(1, 1)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  gl.bindVertexArray(null)

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, shader.tex[0]!)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    tilesetImage
  )
  gl.bindTexture(gl.TEXTURE_2D, null)

  return shader
}
