const layerBlendModeMultiply = 1
const layerBlendModeReplace = 2

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
  readonly #sprs: SprRenderer
  readonly #tiles: TileRenderer

  constructor(
    gl: WebGL2RenderingContext,
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
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const tiles = new Uint16Array(buffer, tilePtr, tileCount)
    this.#loseContext = gl.getExtension('WEBGL_lose_context')
    this.#gl = gl
    this.#overlay = OverlayRenderer.new(gl)
    this.#sprs = SprRenderer.new(
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
      levelH,
      atlasCels,
      atlasAnimCount,
      atlasCelsPerAnim,
      atlasImg
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
    this.#sprs.dispose()
    this.#tiles.dispose()
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
    // no scissor: overlay applies full-screen.
    const clip = this.#beginLayer(false, blendMode, {x: 0, y: 0, w: 0, h: 0})
    this.#overlay.draw()
    this.#endLayer(false, blendMode, clip)
  }

  drawTiles(
    nowMillis: number,
    camX: number,
    camY: number,
    layerScale: number,
    layerModulo: number,
    renderMode: number,
    blendMode: number,
    depth: boolean,
    clipPhy: {x: number; y: number; w: number; h: number}
  ): void {
    const clip = this.#beginLayer(depth, blendMode, clipPhy)
    this.#tiles.draw(
      nowMillis,
      camX,
      camY,
      layerScale,
      clipPhy,
      layerModulo,
      renderMode
    )
    this.#endLayer(depth, blendMode, clip)
  }

  drawLayer(
    buffer: ArrayBuffer,
    sprPtr: number,
    sprCount: number,
    nowMillis: number,
    camX: number,
    camY: number,
    layerScale: number,
    layerModulo: number,
    renderMode: number,
    blendMode: number,
    depth: boolean,
    clipPhy: {x: number; y: number; w: number; h: number}
  ): void {
    const clip = this.#beginLayer(depth, blendMode, clipPhy)
    this.#sprs.draw(
      buffer,
      sprPtr,
      sprCount,
      nowMillis,
      camX,
      camY,
      layerScale,
      clipPhy,
      layerModulo,
      renderMode,
      blendMode
    )
    this.#endLayer(depth, blendMode, clip)
  }

  #beginLayer(
    depth: boolean,
    blendMode: number,
    clipPhy: {x: number; y: number; w: number; h: number}
  ): boolean {
    const clip = clipPhy.w !== 0 && clipPhy.h !== 0
    if (clip) {
      this.#gl.enable(this.#gl.SCISSOR_TEST)
      this.#gl.scissor(
        clipPhy.x,
        this.phyH - clipPhy.y - clipPhy.h,
        clipPhy.w,
        clipPhy.h
      )
    }
    if (blendMode === layerBlendModeMultiply)
      this.#gl.blendFunc(this.#gl.DST_COLOR, this.#gl.ZERO)
    else if (blendMode === layerBlendModeReplace)
      this.#gl.blendFunc(this.#gl.ONE, this.#gl.ZERO)
    if (!depth) this.#gl.disable(this.#gl.DEPTH_TEST)
    return clip
  }

  #endLayer(depth: boolean, blendMode: number, clip: boolean): void {
    if (
      blendMode === layerBlendModeMultiply ||
      blendMode === layerBlendModeReplace
    )
      this.#gl.blendFunc(this.#gl.SRC_ALPHA, this.#gl.ONE_MINUS_SRC_ALPHA)
    if (!depth) this.#gl.enable(this.#gl.DEPTH_TEST)
    if (clip) this.#gl.disable(this.#gl.SCISSOR_TEST)
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
