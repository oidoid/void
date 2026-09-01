const layerBlendModeMultiply = 1
const layerBlendModeReplace = 2

import type {XYWH} from '../geo/box.ts'
import {ClipRenderer} from './clip-renderer/clip-renderer.ts'
import {OverlayRenderer} from './overlay-renderer/overlay-renderer.ts'
import {SprRenderer} from './spr-renderer/spr-renderer.ts'
import {TileRenderer} from './tile-renderer/tile-renderer.ts'

export function getWebGL2(
  canvas: HTMLCanvasElement,
  antialias: boolean
): WebGL2RenderingContext {
  const gl = canvas.getContext('webgl2', {
    antialias,
    powerPreference: 'low-power',
    // avoid flicker caused by clearing the drawing buffer. see
    // https://developer.chrome.com/blog/desynchronized/.
    preserveDrawingBuffer: true
    // disable desync in debug since it breaks FPS meter. only enable
    // when canvas is known to draw next frame.
    // to-do: ...(!debug?.render && {desynchronized: always})
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
  readonly #overlay: OverlayRenderer
  readonly #clip: ClipRenderer
  readonly #sprs: SprRenderer
  readonly #tiles: TileRenderer

  constructor(
    gl: WebGL2RenderingContext,
    buffer: ArrayBuffer,
    tilePtr: number,
    boardW: number,
    boardH: number,
    tileW: number,
    tileH: number,
    atlasCels: Uint16Array,
    atlasAnimCount: number,
    atlasCelsPerAnim: number,
    atlasImg: HTMLImageElement,
    pixel: boolean
  ) {
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const tiles = new Uint16Array(
      buffer,
      tilePtr,
      (boardW / tileW) * (boardH / tileH)
    )
    this.#loseContext = gl.getExtension('WEBGL_lose_context')
    this.#gl = gl
    this.#clip = ClipRenderer.new(gl, pixel)
    this.#overlay = OverlayRenderer.new(gl, pixel)
    this.#sprs = SprRenderer.new(
      gl,
      atlasCels,
      atlasAnimCount,
      atlasCelsPerAnim,
      atlasImg,
      pixel
    )
    this.#tiles = TileRenderer.new(
      gl,
      tiles,
      tileW,
      tileH,
      boardW,
      boardH,
      this.#sprs.atlasCelsTex,
      this.#sprs.sprsheetTex
    )
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
    this.#overlay.dispose()
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

  // layers are composited in draw order; depth is local to one layer.
  clearDepth(): void {
    this.#gl.clearDepth(1)
    this.#gl.clear(this.#gl.DEPTH_BUFFER_BIT)
  }

  drawOverlay(blendMode: number): void {
    this.#beginLayer(false, blendMode)
    this.#overlay.draw()
    this.#endLayer(false, blendMode)
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
    nowMillis: number,
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
      nowMillis,
      clipTarget.camX,
      clipTarget.camY,
      blendMode,
      clipTarget.w,
      clipTarget.h
    )
    this.#clip.end(clipTarget, blendMode)
  }

  #beginLayer(depth: boolean, blendMode: number): void {
    this.#setSourceBlend(blendMode)
    this.#setDepth(depth)
  }

  #setSourceBlend(blendMode: number): void {
    if (blendMode === layerBlendModeMultiply)
      this.#gl.blendFunc(this.#gl.DST_COLOR, this.#gl.ZERO)
    else if (blendMode === layerBlendModeReplace)
      this.#gl.blendFunc(this.#gl.ONE, this.#gl.ZERO)
    else this.#gl.blendFunc(this.#gl.SRC_ALPHA, this.#gl.ONE_MINUS_SRC_ALPHA)
  }

  #setDepth(depth: boolean): void {
    if (depth) this.#gl.enable(this.#gl.DEPTH_TEST)
    else this.#gl.disable(this.#gl.DEPTH_TEST)
  }

  #endLayer(depth: boolean, blendMode: number): void {
    if (
      blendMode === layerBlendModeMultiply ||
      blendMode === layerBlendModeReplace
    )
      this.#setSourceBlend(0)
    if (!depth) this.#gl.enable(this.#gl.DEPTH_TEST)
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
