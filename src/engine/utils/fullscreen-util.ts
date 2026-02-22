import type {Void} from '../void.ts'
import {requestPointerLock} from './dom-util.ts'

export function isFullscreen(): boolean {
  if (!globalThis.document) return false
  return (
    !!document.fullscreenElement ||
    (innerWidth === screen.width && innerHeight === screen.height) ||
    matchMedia('(display-mode: fullscreen)').matches
  )
}

export async function exitFullscreen(): Promise<void> {
  if (document.fullscreenElement)
    try {
      await document.exitFullscreen()
    } catch {}
}

export async function requestFullscreen(
  v: Void,
  noLock?: 'NoLock'
): Promise<boolean> {
  if (!document.fullscreenEnabled) return false

  if (document.fullscreenElement !== v.canvas)
    try {
      await v.canvas.requestFullscreen({navigationUI: 'hide'})
    } catch {
      return false
    }

  if (!noLock) await requestPointerLock(v.canvas)

  v.onEvent()
  return true
}
