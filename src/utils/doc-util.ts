export function initDoc(
  rgba: number,
  mode: 'Int' | 'Fraction'
): HTMLCanvasElement {
  const meta = document.createElement('meta')
  meta.name = 'viewport'
  // don't wait for double-tap scaling on mobile.
  meta.content =
    'width=device-width, maximum-scale=1, minimum-scale=1, user-scalable=no'
  document.head.appendChild(meta)

  document.body.style.margin = '0'
  // fill the screen except for UI chrome.
  document.body.style.width = '100dvw'
  document.body.style.height = '100dvh'
  document.body.style.overflow = 'hidden'
  document.body.style.background = `#${rgba.toString(16).padStart(8, '0')}`

  const canvas = document.createElement('canvas')
  canvas.width = 0 // guarantee Renderer.#resize().
  canvas.style.cursor = 'none'
  canvas.style.display = 'block' // no line height spacing.
  canvas.style.outline = 'none' // disable focus outline.
  canvas.style.cursor = 'none'
  if (mode === 'Int') canvas.style.imageRendering = 'pixelated' // to-do: why doesn't cam mode set this?
  // update on each pointermove *touch* Event like *mouse* Events.
  canvas.style.touchAction = 'none'
  canvas.tabIndex = 0
  canvas.focus()
  document.body.append(canvas)

  return canvas
}
