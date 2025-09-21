import {dateToTimestamp} from '../types/time.ts'
import {download} from '../utils/doc-util.ts'

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
    }, 'image/png')
  })
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

export async function downloadScreenshot(
  canvas: HTMLCanvasElement,
  name: string
): Promise<void> {
  using img = await screenshot(canvas)
  download(img.uri, `${name}-screenshot-${dateToTimestamp(new Date())}.png`)
}
