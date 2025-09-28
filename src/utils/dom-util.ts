import {rgbaHex} from './color-util.ts'

export function initMetaViewport(): void {
  if (document.querySelector('meta[name="viewport"]')) return
  const meta = document.createElement('meta')
  meta.name = 'viewport'
  // don't wait for double-tap scaling on mobile.
  meta.content =
    'width=device-width, maximum-scale=1, minimum-scale=1, user-scalable=no'
  document.head.appendChild(meta)
}

export function initBody(
  canvas: Readonly<HTMLCanvasElement>,
  rgba: number
): void {
  if (canvas.parentNode !== document.body) return
  document.body.style.margin = '0'
  // fill the screen except for UI chrome.
  document.body.style.width = '100dvw'
  document.body.style.height = '100dvh'
  document.body.style.overflow = 'hidden'
  document.body.style.background = rgbaHex(rgba)
}

export function download(uri: string, filename: string): void {
  const a = document.createElement('a')
  a.href = uri
  a.download = filename
  a.click()
  a.remove()
}
