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
    tileH: number
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

    const tiles = new Uint16Array(buffer, tilePtr, tileCount)
    this.#gl = gl
    this.#sprites = SpriteRenderer.new(gl) // to-do: can we avoid work at construction?
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

  draw(
    buffer: ArrayBuffer,
    spritePtr: number,
    spriteCount: number,
    camX: number,
    camY: number
  ): void {
    const gl = this.#gl
    gl.clearColor(15 / 255, 15 / 255, 30 / 255, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    this.#tiles.draw(camX, camY)
    this.#sprites.draw(buffer, spritePtr, spriteCount, camX, camY)
  }

  // https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
  resize(): void {
    const canvas = this.#gl.canvas as HTMLCanvasElement
    const bounds = canvas.getBoundingClientRect()
    const displayW = Math.ceil(bounds.width * devicePixelRatio)
    const displayH = Math.ceil(bounds.height * devicePixelRatio)
    if (canvas.width === displayW && canvas.height === displayH) return

    canvas.width = displayW
    canvas.height = displayH
    this.#gl.viewport(0, 0, this.canvasW, this.canvasH)
  }
}
