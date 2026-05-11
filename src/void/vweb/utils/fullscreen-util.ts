import {requestPointerLock} from './dom-util.ts'

export function isFullscreen(): boolean {
  if (!globalThis.document) return false
  return (
    !!document.fullscreenElement ||
    (innerWidth === screen.width && innerHeight === screen.height) ||
    matchMedia('(display-mode: fullscreen)').matches
  )
}

export async function exitFullscreen(): Promise<boolean> {
  if (document.fullscreenElement)
    try {
      await document.exitFullscreen()
    } catch {
      return false
    }

  // hack: no pointer up or cancel.
  // to-do: v.input.reset()

  return true
}

export async function requestFullscreen(
  v: {canvas: HTMLCanvasElement},
  noLock?: 'NoLock'
): Promise<boolean> {
  if (!document.fullscreenEnabled) return false

  if (document.fullscreenElement !== v.canvas)
    try {
      await v.canvas.requestFullscreen({navigationUI: 'hide'})
    } catch {
      return false
    }

  // hack: no pointer up or cancel.
  // to-do: v.input.reset()

  if (!noLock) await requestPointerLock(v.canvas)

  // to-do: v.onEvent()
  return true
}
