import {SpriteRenderer} from './sprite-renderer/sprite-renderer.ts'

export class Renderer {
  readonly #gl: WebGL2RenderingContext
  readonly #sprites: SpriteRenderer

  constructor(canvas: HTMLCanvasElement) {
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

    this.#gl = gl
    this.#sprites = SpriteRenderer.new(gl) // to-do: can we avoid work at construction?
  }

  dispose(): void {
    this.#sprites.dispose()
  }

  draw(buffer: ArrayBuffer, spritePtr: number, spriteCount: number): void {
    const gl = this.#gl
    gl.clearColor(15 / 255, 15 / 255, 30 / 255, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    this.#sprites.draw(buffer, spritePtr, spriteCount)
  }

  resize(w: number, h: number): void {
    this.#gl.viewport(0, 0, w, h)
    this.#sprites.resize(w, h)
  }
}
