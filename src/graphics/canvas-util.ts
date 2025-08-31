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
