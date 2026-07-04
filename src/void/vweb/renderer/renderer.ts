import {SpriteRenderer} from './sprite-renderer/sprite-renderer.ts'
import {TileRenderer} from './tile-renderer/tile-renderer.ts'

export class Renderer {
  readonly #gl: WebGL2RenderingContext
  readonly #sprites: SpriteRenderer
  readonly #tiles: TileRenderer

  constructor(
    canvas: HTMLCanvasElement,
    buffer: ArrayBuffer,
    tilePtr: number,
    tileCount: number,
    levelX: number,
    levelY: number,
    levelW: number,
    levelH: number,
    tileW: number,
    tileH: number,
    atlasCels: Uint16Array,
    atlasAnimCount: number,
    atlasCelsPerAnim: number,
    atlasImg: HTMLImageElement
  ) {
    const gl = canvas.getContext('webgl2') // to-do: can't do this here and always need to use props.
    if (!gl) {
      const ctx2d = canvas.getContext('2d')!
      ctx2d.fillStyle = 'orange'
      ctx2d.fillRect(0, 0, canvas.width, canvas.height)
      const msg = 'WebGL2 is not available in this browser.'
      ctx2d.fillStyle = '#000'
      ctx2d.font = `bold 12px sans-serif`
      ctx2d.textAlign = 'center'
      ctx2d.textBaseline = 'middle'
      ctx2d.fillText(msg, canvas.width / 2, canvas.height / 2)
      throw Error('webgl2 unavailable')
    }

    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const tiles = new Uint16Array(buffer, tilePtr, tileCount)
    this.#gl = gl
    this.#sprites = SpriteRenderer.new(
      gl,
      atlasCels,
      atlasAnimCount,
      atlasCelsPerAnim,
      atlasImg
    )
    this.#tiles = TileRenderer.new(
      gl,
      tiles,
      tileW,
      tileH,
      levelX,
      levelY,
      levelW,
      levelH
    )
  }

  // integral width.
  get canvasW(): number {
    return this.#gl.drawingBufferWidth
  }

  // integral height.
  get canvasH(): number {
    return this.#gl.drawingBufferHeight
  }

  dispose(): void {
    this.#sprites.dispose()
    this.#tiles.dispose()
  }

  clear(): void {
    const gl = this.#gl
    gl.clearColor(0xe6 / 255, 0xe6 / 255, 0xe6 / 255, 1)
    // to-do: expose.
    gl.clearDepth(1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }

  drawTiles(
    camX: number,
    camY: number,
    layerScale: number,
    renderMode: number,
    noDepth: boolean,
    clipPhy: {x: number; y: number; w: number; h: number}
  ): void {
    const clip = this.#beginLayer(noDepth, clipPhy)
    this.#tiles.draw(camX, camY, layerScale, renderMode)
    this.#endLayer(noDepth, clip)
  }

  drawLayer(
    buffer: ArrayBuffer,
    spritePtr: number,
    spriteCount: number,
    camX: number,
    camY: number,
    layerScale: number,
    renderMode: number,
    noDepth: boolean,
    clipPhy: {x: number; y: number; w: number; h: number}
  ): void {
    const clip = this.#beginLayer(noDepth, clipPhy)
    this.#sprites.draw(
      buffer,
      spritePtr,
      spriteCount,
      camX,
      camY,
      layerScale,
      renderMode
    )
    this.#endLayer(noDepth, clip)
  }

  #beginLayer(
    noDepth: boolean,
    clipPhy: {x: number; y: number; w: number; h: number}
  ): boolean {
    const clip = clipPhy.w !== 0 && clipPhy.h !== 0
    if (clip) {
      this.#gl.enable(this.#gl.SCISSOR_TEST)
      this.#gl.scissor(
        clipPhy.x,
        this.canvasH - clipPhy.y - clipPhy.h,
        clipPhy.w,
        clipPhy.h
      )
    }
    if (noDepth) this.#gl.disable(this.#gl.DEPTH_TEST)
    return clip
  }

  #endLayer(noDepth: boolean, clip: boolean): void {
    if (noDepth) this.#gl.enable(this.#gl.DEPTH_TEST)
    if (clip) this.#gl.disable(this.#gl.SCISSOR_TEST)
  }

  // https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
  resize(): void {
    const canvas = this.#gl.canvas as HTMLCanvasElement
    const bounds = canvas.getBoundingClientRect()
    const displayW = Math.round(bounds.width * devicePixelRatio)
    const displayH = Math.round(bounds.height * devicePixelRatio)
    if (canvas.width === displayW && canvas.height === displayH) return

    canvas.width = displayW
    canvas.height = displayH
    this.#gl.viewport(0, 0, this.canvasW, this.canvasH)
  }
}
