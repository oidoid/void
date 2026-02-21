import type {Void} from '../void.ts'

export function isFullscreen(): boolean {
  return (
    !!document.fullscreenElement ||
    (innerWidth === screen.width && innerHeight === screen.height) ||
    matchMedia('(display-mode: fullscreen)').matches
  )
}

export async function requestFullscreen(v: Void): Promise<boolean> {
  if (!document.fullscreenEnabled) return false

  if (document.fullscreenElement !== v.canvas)
    try {
      await v.canvas.requestFullscreen({navigationUI: 'hide'})
    } catch {
      return false
    }

  if (!document.pointerLockElement) {
    try {
      // to-do: how does pointer know about this being unadjusted?
      await v.canvas.requestPointerLock({unadjustedMovement: true})
    } catch (err) {
      if (err instanceof Error && err.name === 'NotSupportedError')
        try {
          await v.canvas.requestPointerLock()
        } catch {}
    }
  }

  v.onEvent()
  return true
}
