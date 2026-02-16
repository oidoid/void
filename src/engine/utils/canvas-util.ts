import type {RenderMode} from '../graphics/render-mode.ts'
import {dateToTimestamp} from '../types/time.ts'
import {download} from './dom-util.ts'

export async function downloadScreenshot(
  canvas: HTMLCanvasElement,
  name: string
): Promise<void> {
  using img = await screenshot(canvas)
  download(img.uri, `${name}-screenshot-${dateToTimestamp(new Date())}.webp`)
}

export function initCanvas(
  canvas: HTMLCanvasElement | null | undefined,
  mode: RenderMode
): HTMLCanvasElement {
  canvas ??= document.createElement('canvas')
  canvas.width = 0 // guarantee Renderer.#resize().
  canvas.style.cursor = 'none'
  canvas.style.display = 'block' // no line height spacing.
  canvas.style.outline = 'none' // disable focus outline.
  if (mode === 'Int') canvas.style.imageRendering = 'pixelated' // to-do: why doesn't cam mode set this?
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

export async function requestFullscreen(
  canvas: HTMLCanvasElement
): Promise<boolean> {
  if (!document.fullscreenEnabled) return false

  if (document.fullscreenElement !== canvas)
    try {
      await canvas.requestFullscreen({navigationUI: 'hide'})
    } catch {
      return false
    }

  if (!document.pointerLockElement) {
    try {
      await canvas.requestPointerLock({unadjustedMovement: true})
    } catch (err) {
      if (err instanceof Error && err.name === 'NotSupportedError')
        try {
          await canvas.requestPointerLock()
        } catch {}
    }
  }

  return true
}

/** draws a canvas to a blob URI. */
export function screenshot(
  canvas: HTMLCanvasElement
): Promise<Disposable & {uri: string}> {
  return new Promise((fulfil, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        const img = {
          [Symbol.dispose]() {
            URL.revokeObjectURL(this.uri)
          },
          uri: URL.createObjectURL(blob)
        }
        fulfil(img)
      } else reject(Error('no blob'))
    }, 'image/webp')
  })
}
