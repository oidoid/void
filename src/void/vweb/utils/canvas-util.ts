import {download} from './dom-util.ts'

export type RenderMode = 'Int' | 'Float'

export async function downloadScreenshot(
  canvas: HTMLCanvasElement,
  name: string
): Promise<void> {
  using img = await screenshot(canvas)
  // to-do: ${yyyy}${MM}${dd}${hh}${mm}${ss}
  const timestamp = 'now'
  download(img.uri, `${name}-screenshot-${timestamp}.webp`)
}

export function initCanvas(
  canvas: HTMLCanvasElement | null | undefined,
  mode: RenderMode
): HTMLCanvasElement {
  canvas ??= document.createElement('canvas')
  canvas.width = 0 // guarantee Renderer.#resize().
  // canvas.style.cursor = 'none'
  canvas.style.display = 'block' // no line height spacing.
  canvas.style.outline = 'none' // disable focus outline.
  // to-do: fix me and also fix the context pixelation setting!
  canvas.style.imageRendering = mode === 'Int' ? 'pixelated' : 'smooth' // to-do: why doesn't cam mode set this?
  // update on each pointermove *touch* Event like *mouse* Events.
  canvas.style.touchAction = 'none'
  canvas.tabIndex = 0

  canvas.style.width = '100%'
  canvas.style.height = '100%'

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

/** draws a canvas to a blob URI. */
export function screenshot(
  canvas: HTMLCanvasElement
): Promise<Disposable & {uri: string}> {
  return new Promise((fulfil, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          const img = {
            [Symbol.dispose]() {
              URL.revokeObjectURL(this.uri)
            },
            uri: URL.createObjectURL(blob)
          }
          fulfil(img)
        } else reject(Error('no blob'))
      },
      'image/webp',
      1
    )
  })
}
