import type {BoardConfig} from '../boards/board-config.ts'
import type {XYWH} from '../geo/box.ts'
import {ClipRenderer} from './clip-renderer/clip-renderer.ts'
import {SprRenderer} from './spr-renderer/spr-renderer.ts'
import {TileRenderer} from './tile-renderer/tile-renderer.ts'

export function getWebGL2(canvas: HTMLCanvasElement): WebGL2RenderingContext {
  const gl = canvas.getContext('webgl2', {
    // sprites draw into offscreen targets; the canvas only composites
    // axis-aligned quads so multisampling would smooth nothing.
    antialias: false,
    // layers depth test in their own offscreen target; the canvas only
    // composites them.
    depth: false,
    powerPreference: 'low-power',
    // avoid flicker caused by clearing the drawing buffer. see
    // https://developer.chrome.com/blog/desynchronized/.
    preserveDrawingBuffer: true
    // disable desync in debug since it breaks FPS meter. only enable
    // when canvas is known to draw next frame.
    // to-do: ...(!debug?.draw && {desynchronized: always})
  })
  if (gl) return gl

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = 'orange'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#000'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      'WebGL2 is not available in this browser.',
      canvas.width / 2,
      canvas.height / 2
    )
  }
  throw Error('WebGL2 unavailable')
}

export class Renderer {
  readonly #gl: WebGL2RenderingContext
  readonly #loseContext: WEBGL_lose_context | null
  readonly #clip: ClipRenderer
  readonly #sprs: SprRenderer
  readonly #tiles: TileRenderer

  constructor(
    gl: WebGL2RenderingContext,
    board: Readonly<BoardConfig>,
    atlasTexels: Uint16Array,
    atlasImg: HTMLImageElement,
    pixel: boolean
  ) {
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    this.#loseContext = gl.getExtension('WEBGL_lose_context')
    this.#gl = gl
    this.#clip = ClipRenderer.new(gl, pixel)
    this.#sprs = SprRenderer.new(gl, atlasTexels, atlasImg, pixel)
    this.#tiles = TileRenderer.new(
      gl,
      board,
      this.#sprs.atlasTex,
      this.#sprs.sprsheetTex
    )
  }

  updateBoard(board: Readonly<BoardConfig>): void {
    this.#tiles.update(board)
  }

  // integral width in physical pixels.
  get phyW(): number {
    return this.#gl.drawingBufferWidth
  }

  // integral height in physical pixels.
  get phyH(): number {
    return this.#gl.drawingBufferHeight
  }

  isContextLost(): boolean {
    return this.#gl.isContextLost()
  }

  dispose(): void {
    if (this.#gl.isContextLost()) return
    this.#clip.dispose()
    this.#tiles.dispose()
    this.#sprs.dispose()
  }

  loseContext(): void {
    if (!this.#loseContext) return
    this.#loseContext.loseContext()
    setTimeout(
      () => this.#loseContext?.restoreContext(),
      1000 + Math.random() * 2000
    )
  }

  clear(r: number, g: number, b: number, a: number): void {
    this.#gl.clearColor(r, g, b, a)
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT)
  }

  drawTiles(
    camX: number,
    camY: number,
    layerScale: number,
    blendMode: number,
    depth: boolean,
    clipPhy: Readonly<XYWH>
  ): void {
    const clipTarget = this.#clip.begin(
      layerScale,
      blendMode,
      depth,
      clipPhy,
      camX,
      camY
    )
    this.#tiles.draw(
      clipTarget.camX,
      clipTarget.camY,
      clipTarget.w,
      clipTarget.h
    )
    this.#clip.end(clipTarget, blendMode)
  }

  drawLayer(
    buffer: ArrayBuffer,
    sprPtr: number,
    sprCount: number,
    camX: number,
    camY: number,
    layerScale: number,
    blendMode: number,
    depth: boolean,
    clipPhy: Readonly<XYWH>
  ): void {
    const clipTarget = this.#clip.begin(
      layerScale,
      blendMode,
      depth,
      clipPhy,
      camX,
      camY
    )
    this.#sprs.draw(
      buffer,
      sprPtr,
      sprCount,
      clipTarget.camX,
      clipTarget.camY,
      blendMode,
      clipTarget.w,
      clipTarget.h
    )
    this.#clip.end(clipTarget, blendMode)
  }

  // https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
  resize(phyW: number, phyH: number): void {
    const canvas = this.#gl.canvas as HTMLCanvasElement
    if (canvas.width === phyW && canvas.height === phyH) return
    canvas.width = phyW
    canvas.height = phyH
    this.#gl.viewport(0, 0, this.phyW, this.phyH)
  }
}
