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

export async function requestFullscreen(el: Element): Promise<boolean> {
  if (!document.fullscreenEnabled) return false

  if (document.fullscreenElement !== el)
    try {
      await el.requestFullscreen({navigationUI: 'hide'})
    } catch {
      return false
    }

  // hack: no pointer up or cancel.
  // to-do: v.input.reset()

  return true
}
