export type RenderMode = 'Int' | 'Float'

export function initCanvas(
  canvas: HTMLCanvasElement | null | undefined,
  mode: RenderMode
): HTMLCanvasElement {
  canvas ??= document.createElement('canvas')
  canvas.width = 0 // guarantee Renderer.#resize().
  // canvas.style.cursor = 'none'
  canvas.style.display = 'block' // no line height spacing.
  canvas.style.outline = 'none' // disable focus outline.
  canvas.style.imageRendering = mode === 'Int' ? 'pixelated' : 'smooth' // to-do: why doesn't cam mode set this?
  // update on each pointermove *touch* Event like *mouse* Events.
  canvas.style.touchAction = 'none'
  canvas.tabIndex = 0
  canvas.focus()
  if (!canvas.parentNode) {
    const main = document.createElement('main') // a11y.
    main.style.backgroundColor = document.body.style.backgroundColor
    main.style.height = '100%'
    main.append(canvas)
    document.body.append(main)
  }
  return canvas
}
