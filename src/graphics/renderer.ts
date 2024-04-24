import type {TagFormat} from '../atlas/anim.js'
import type {Atlas} from '../atlas/atlas.js'
import {debug} from '../types/debug.js'
import {BitmapBuffer} from './bitmap.js'
import {Cam} from './cam.js'
import {fragGLSL} from './frag.glsl.js'
import {vertGLSL} from './vert.glsl.js'

type GLUniforms = {readonly [name: string]: WebGLUniformLocation | null}
type GL = WebGL2RenderingContext
type GLProgram = WebGLProgram | null

const uv: Readonly<Int8Array> = new Int8Array([1, 1, 0, 1, 1, 0, 0, 0]) // texcoords

export class Renderer {
  #bmpBuffer: Readonly<WebGLBuffer> | null = null
  readonly #canvas: HTMLCanvasElement
  #clearColor: number = 0x000000ff // rgba
  readonly #cels: Readonly<Uint16Array>
  #gl?: GL
  #loseContext: Readonly<WEBGL_lose_context | null> = null
  readonly #atlasImage: HTMLImageElement
  #uniforms: Readonly<GLUniforms> = {}
  #vertArray: WebGLVertexArrayObject | null = null

  constructor(
    atlas: Atlas<TagFormat>,
    canvas: HTMLCanvasElement,
    atlasImage: HTMLImageElement
  ) {
    this.#canvas = canvas
    this.#cels = new Uint16Array(atlas.cels)
    this.#atlasImage = atlasImage
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
    const gl = this.#canvas.getContext('webgl2', {
      antialias: false,
      desynchronized: !debug, // Breaks render stats.
      powerPreference: 'high-performance'
    })
    if (!gl) throw Error('WebGL v2 unsupported')
    this.#gl = gl

    this.clearColor(this.#clearColor)

    // Allow transparent textures to be layered.
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // Enable z-buffer for [0, 1] ([foreground, background]).
    gl.enable(gl.DEPTH_TEST)
    gl.depthRange(0, 1)
    gl.clearDepth(1)
    gl.depthFunc(gl.LESS)

    // Disable image colorspace conversions. The default is browser dependent.
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, false)

    const pgm = loadProgram(gl, vertGLSL, fragGLSL)
    this.#uniforms = getUniformLocations(gl, pgm)

    gl.uniform2ui(
      this.#uniforms.uAtlasWH!,
      this.#atlasImage.naturalWidth,
      this.#atlasImage.naturalHeight
    )

    this.#vertArray = gl.createVertexArray()
    gl.bindVertexArray(this.#vertArray)

    const uvBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribIPointer(0, 2, gl.BYTE, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    this.#bmpBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.#bmpBuffer)
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

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW)
    gl.bindBuffer(this.#gl.ARRAY_BUFFER, null)

    gl.uniform1i(this.#uniforms.uCels!, 0)
    gl.activeTexture(gl.TEXTURE0)
    const dataTex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, dataTex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA16UI,
      1,
      this.#cels.length / 4, // 4 u8s per row
      0,
      gl.RGBA_INTEGER,
      gl.UNSIGNED_SHORT,
      this.#cels
    )

    gl.uniform1i(this.#uniforms.uAtlas!, 1)
    gl.activeTexture(gl.TEXTURE1)
    const atlasTex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, atlasTex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this.#atlasImage
    )

    this.#loseContext = gl.getExtension('WEBGL_lose_context')
  }

  get loseContext(): WEBGL_lose_context | null {
    return this.#loseContext
  }

  hasContext(): boolean {
    return !this.#gl?.isContextLost()
  }

  render(
    cam: Readonly<Cam>,
    frame: number,
    bmps: Readonly<BitmapBuffer>
  ): void {
    if (!this.#gl) throw Error('no GL context')
    this.#resize(cam)
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT)

    this.#gl.uniform4i(this.#uniforms.uCam!, cam.x, cam.y, cam.w, cam.h)
    this.#gl.uniform1ui(this.#uniforms.uFrame!, frame)

    this.#gl.bindVertexArray(this.#vertArray)

    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#bmpBuffer)
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
  }

  #resize(cam: Readonly<Cam>): void {
    if (this.#canvas.width === cam.w && this.#canvas.height === cam.h) return
    this.#canvas.width = cam.w
    this.#canvas.height = cam.h
    this.#gl!.viewport(0, 0, cam.w, cam.h)

    // These pixels may be greater than, less than, or equal to cam.
    this.#canvas.style.width = `${(cam.w * cam.scale) / devicePixelRatio}px`
    this.#canvas.style.height = `${(cam.h * cam.scale) / devicePixelRatio}px`
  }
}

function compileShader(gl: GL, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw Error('shader creation failed')
  gl.shaderSource(shader, src.trim())
  gl.compileShader(shader)

  const log = gl.getShaderInfoLog(shader)?.slice(0, -1)
  if (log) console.warn(log)

  return shader
}

function getUniformLocations(gl: GL, pgm: GLProgram): GLUniforms {
  if (!pgm) return {}
  const len = gl.getProgramParameter(pgm, gl.ACTIVE_UNIFORMS)
  const locations: {[name: string]: WebGLUniformLocation | null} = {}
  for (let i = 0; i < len; ++i) {
    const uniform = gl.getActiveUniform(pgm, i)
    if (uniform == null) throw Error(`missing shader uniform at index ${i}`)
    locations[uniform.name] = gl.getUniformLocation(pgm, uniform.name)
  }
  return locations
}

function loadProgram(gl: GL, vertGLSL: string, fragGLSL: string): GLProgram {
  const pgm = gl.createProgram()
  if (!pgm) return null

  const vert = compileShader(gl, gl.VERTEX_SHADER, vertGLSL)
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragGLSL)
  gl.attachShader(pgm, vert)
  gl.attachShader(pgm, frag)
  gl.linkProgram(pgm)
  gl.useProgram(pgm)

  const log = gl.getProgramInfoLog(pgm)?.slice(0, -1)
  if (log) console.warn(log)

  gl.detachShader(pgm, frag)
  gl.detachShader(pgm, vert)
  gl.deleteShader(frag)
  gl.deleteShader(vert)

  return pgm
}
