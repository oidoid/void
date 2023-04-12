import { AsepriteFileTag, AtlasMeta } from '@/atlas-pack'
import { assertNonNull, colorIntToFloats, NonNull } from '@/ooz'
import {
  BitmapBuffer,
  bufferGLData,
  Cam,
  clientCanvasWH,
  fragmentGLSL,
  getGLAttributeLocations,
  getGLUniformLocation,
  getGLUniformLocations,
  initGLAttribute,
  loadGLDataTexture,
  loadGLProgram,
  loadGLTexture,
  nativeCanvasWH,
  ShaderLayout,
  vertexGLSL,
} from '@/void'

const uv: Uint16Array = new Uint16Array(
  Object.freeze([1, 1, 0, 1, 1, 0, 0, 0]),
)
const uvLen: number = uv.length / 2 // dimensions

export class Renderer {
  static new(
    canvas: HTMLCanvasElement,
    atlas: HTMLImageElement,
    layout: ShaderLayout,
    atlasMeta: AtlasMeta<AsepriteFileTag>,
  ): Renderer {
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      // Note: desynchronization breaks FPS rendering stats.
      // https://developer.chrome.com/blog/desynchronized
      desynchronized: true,
      preserveDrawingBuffer: false,
    })
    assertNonNull(gl, 'WebGL 2 unsupported.')

    // Avoid initial color flash by matching the background. [palette][theme]
    const [r, g, b, a] = colorIntToFloats(0x0a1a1a_ff) // to-do: parameterize.
    gl.clearColor(r, g, b, a)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Allow transparent textures to be layered.
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // Enable z-buffer.
    gl.enable(gl.DEPTH_TEST)
    // z-value is is in [0, 1].
    gl.depthRange(0, 1)
    // Define z-order: high values are background, low values are foreground.
    gl.depthFunc(gl.LESS)
    //  the value used by glClear() to clear the Z-Buffer. A value of 1.0 is the highest Z value, OpenGL renders all tiles. If we choose 0.0, OpenGL does not draw any tiles.
    gl.clearDepth(1)

    // Disable image colorspace conversions. The default is browser dependent.
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, false)

    const program = loadGLProgram(gl, vertexGLSL, fragmentGLSL)
    const uniforms = getGLUniformLocations(gl, program)

    gl.uniform1i(getGLUniformLocation(layout, uniforms, 'uAtlas'), 0)
    gl.uniform1i(getGLUniformLocation(layout, uniforms, 'uSourceByCelID'), 1) // should be keyof shader layout
    gl.uniform2ui(
      getGLUniformLocation(layout, uniforms, 'uAtlasSize'),
      atlas.naturalWidth,
      atlas.naturalHeight,
    )

    const attributes = getGLAttributeLocations(gl, program)

    const vertexArray = gl.createVertexArray()
    gl.bindVertexArray(vertexArray)

    const perVertexBuffer = gl.createBuffer()
    for (const attr of layout.perVertex.attributes) {
      initGLAttribute(
        gl,
        layout.perVertex.stride,
        layout.perVertex.divisor,
        perVertexBuffer,
        NonNull(attributes[attr.name]),
        attr,
      )
    }
    bufferGLData(gl, perVertexBuffer, uv, gl.STATIC_DRAW)

    const perInstanceBuffer = gl.createBuffer()
    for (const attr of layout.perInstance.attributes) {
      initGLAttribute(
        gl,
        layout.perInstance.stride,
        layout.perInstance.divisor,
        perInstanceBuffer,
        NonNull(attributes[attr.name]),
        attr,
      )
    }

    // Leave vertexArray bound.

    loadGLTexture(gl, gl.TEXTURE0, atlas)

    const dat = new Uint16Array(
      atlasMeta.celBoundsByID.flatMap((box) => [box.x, box.y, box.w, box.h]),
    )

    loadGLDataTexture(
      gl,
      gl.TEXTURE1,
      gl.RGBA16UI,
      1,
      dat.byteLength / (4 * 2), // 4 shorts per row
      gl.RGBA_INTEGER,
      gl.UNSIGNED_SHORT,
      dat,
    )
    // Leave textures bound.

    return new Renderer(
      gl,
      layout,
      uniforms,
      new Float32Array(4 * 4),
      perInstanceBuffer,
      gl.getExtension('WEBGL_lose_context'),
    )
  }

  readonly #gl: GL
  readonly #layout: ShaderLayout
  readonly #uniforms: Readonly<{ [name: string]: GLUniformLocation }>
  readonly #projection: Readonly<Float32Array>
  readonly #perInstanceBuffer: Readonly<GLBuffer>
  readonly #loseContext: Readonly<GLLoseContext>

  constructor(
    gl: GL,
    layout: ShaderLayout,
    uniforms: Readonly<{ [name: string]: GLUniformLocation }>,
    projection: Readonly<Float32Array>,
    perInstanceBuffer: Readonly<GLBuffer>,
    loseContext: Readonly<GLLoseContext>,
  ) {
    this.#gl = gl
    this.#layout = layout
    this.#uniforms = uniforms
    this.#projection = projection
    this.#perInstanceBuffer = perInstanceBuffer
    this.#loseContext = loseContext
  }

  isContextLost(): boolean {
    return this.#gl.isContextLost()
  }

  loseContext(): void {
    this.#loseContext?.loseContext()
  }

  /**
   * @arg canvasWH The desired resolution of the canvas in CSS pixels. E.g.,
   *               {w: window.innerWidth, h: window.innerHeight}.
   * @arg scale Positive integer zoom.
   */
  render(
    _time: number,
    cam: Readonly<Cam>,
    bitmaps: BitmapBuffer,
  ): void {
    this.#resize(cam)
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT)
    // this.#gl.uniform1ui(
    //   GL.uniformLocation(this.#layout, this.#uniforms, 'time'),
    //   time,
    // );
    bufferGLData(
      this.#gl,
      this.#perInstanceBuffer,
      bitmaps.buffer,
      this.#gl.STREAM_DRAW,
    )
    this.#gl.drawArraysInstanced(
      this.#gl.TRIANGLE_STRIP,
      0,
      uvLen,
      bitmaps.size,
    )
  }

  restoreContext(): void {
    this.#loseContext?.restoreContext()
  }

  /** @arg canvasWH The desired resolution of the canvas in CSS pixels. E.g.,
                    {w: window.innerWidth, h: window.innerHeight}.
      @arg scale Positive integer zoom. */
  #resize(cam: Readonly<Cam>): void {
    // Always <= native. These are level pixels.
    // Always >= native. These are physical pixels.
    const nativeWH = nativeCanvasWH(cam.viewport.wh, cam.scale)

    if (
      this.#gl.canvas.width !== nativeWH.x ||
      this.#gl.canvas.height !== nativeWH.y
    ) {
      this.#gl.canvas.width = nativeWH.x
      this.#gl.canvas.height = nativeWH.y

      this.#gl.viewport(0, 0, nativeWH.x, nativeWH.y)

      console.debug(
        `Canvas resized to ${nativeWH.x}×${nativeWH.y} native ` +
          `pixels with ${cam.viewport.w}×${cam.viewport.h} cam (level ` +
          `pixels) at a ${cam.scale}x scale.`,
      )
    }

    // to-do: support OffscreenCanvas.
    if (this.#gl.canvas instanceof HTMLCanvasElement) {
      // No constraints. These pixels may be greater than, less than, or equal to
      // native.
      const clientWH = clientCanvasWH(window, nativeWH) // to-do: pass in devicePixelRatio.
      const diffW =
        Number.parseFloat(this.#gl.canvas.style.width.slice(0, -2)) -
        clientWH.x
      const diffH =
        Number.parseFloat(this.#gl.canvas.style.height.slice(0, -2)) -
        clientWH.y

      if (
        !Number.isFinite(diffW) || Math.abs(diffW) >= .5 ||
        !Number.isFinite(diffH) || Math.abs(diffH) >= .5
      ) {
        // Ignore zoom.
        this.#gl.canvas.style.width = `${clientWH.x}px`
        this.#gl.canvas.style.height = `${clientWH.y}px`
        console.debug(
          `Canvas styled to ` +
            `${this.#gl.canvas.style.width}×${this.#gl.canvas.style.height} ` +
            `for ${devicePixelRatio}× pixel density.`,
        )
      }
    }

    this.#projection.set(project(cam))
    this.#gl.uniformMatrix4fv(
      getGLUniformLocation(this.#layout, this.#uniforms, 'uProjection'),
      false,
      this.#projection,
    )
  }
}

// to-do: don't recreate array every loop
function project(cam: Readonly<Cam>): number[] {
  // Convert the pixels to clipspace by taking them as a fraction of the cam
  // resolution, scaling to 0-2, flipping the y-coordinate so that positive y
  // is downward, and translating to -1 to 1 and again by the camera position.
  const { w, h } = { w: 2 / cam.viewport.w, h: 2 / cam.viewport.h }
  // deno-fmt-ignore
  return [
    w,  0, 0, -1 - cam.viewport.x * w,
    0, -h, 0,  1 + cam.viewport.y * h,
    0,  0, 1,                       0,
    0,  0, 0,                       1
  ]
}
