const layerBlendModeMultiply = 1
const layerBlendModeReplace = 2

import {OverlayRenderer} from './overlay-renderer/overlay-renderer.ts'
import {SpriteRenderer} from './sprite-renderer/sprite-renderer.ts'
import {TileRenderer} from './tile-renderer/tile-renderer.ts'

export class Renderer {
  readonly #gl: WebGL2RenderingContext
  readonly #overlay: OverlayRenderer
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
    this.#overlay = OverlayRenderer.new(gl)
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

  // integral width in physical pixels.
  get phyW(): number {
    return this.#gl.drawingBufferWidth
  }

  // integral height in physical pixels.
  get phyH(): number {
    return this.#gl.drawingBufferHeight
  }

  dispose(): void {
    this.#overlay.dispose()
    this.#sprites.dispose()
    this.#tiles.dispose()
  }

  clear(): void {
    const gl = this.#gl
    gl.clearColor(0, 0, 0, 1)
    // to-do: expose.
    gl.clearDepth(1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }

  drawOverlay(blendMode: number): void {
    // no scissor: overlay applies full-screen.
    const clip = this.#beginLayer(false, blendMode, {x: 0, y: 0, w: 0, h: 0})
    this.#overlay.draw()
    this.#endLayer(false, blendMode, clip)
  }

  drawTiles(
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
    this.#tiles.draw(camX, camY, layerScale, clipPhy, layerModulo, renderMode)
    this.#endLayer(depth, blendMode, clip)
  }

  drawLayer(
    buffer: ArrayBuffer,
    spritePtr: number,
    spriteCount: number,
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
    this.#sprites.draw(
      buffer,
      spritePtr,
      spriteCount,
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
