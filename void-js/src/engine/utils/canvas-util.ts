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
