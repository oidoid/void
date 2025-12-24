import {rgbaHex} from './color-util.ts'

export function download(uri: string, filename: string): void {
  const a = document.createElement('a')
  a.href = uri
  a.download = filename
  a.click()
  a.remove()
}

export function initBody(rgba: number): void {
  document.body.style.margin = '0'
  // fill the screen except for UI chrome.
  document.body.style.width = '100dvw'
  document.body.style.height = '100dvh'
  document.body.style.overflow = 'hidden'
  document.body.style.background = rgbaHex(rgba)
}

export function initMetaViewport(description: string | undefined): void {
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta')
    viewport.name = 'viewport'
    // don't wait for double-tap scaling on mobile.
    viewport.content =
      'width=device-width, maximum-scale=1, minimum-scale=1, user-scalable=no'
    document.head.appendChild(viewport)
  }

  if (description && !document.querySelector('meta[name="description"]')) {
    const desc = document.createElement('meta')
    desc.name = 'description'
    desc.content = description
    document.head.appendChild(desc)
  }
}
