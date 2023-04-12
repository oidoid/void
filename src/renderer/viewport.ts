import { Box, XY } from '@/ooz'

/** @return The maximum scale possible. what to multiply level px's by to get native pixels. integral */
export function viewportScale(
  nativeViewportWH: Readonly<XY>, // not canvas
  minViewportWH: Readonly<XY>,
  zoomOut: number,
): number {
  const x = nativeViewportWH.x / minViewportWH.x
  const y = nativeViewportWH.y / minViewportWH.y
  return Math.max(1, Math.floor(Math.min(x, y)) - zoomOut)
}

// returns wh of body in css px
export function clientViewportWH(window: Window): XY {
  // window.document.body.getBoundingClientRect() returns incorrectly large
  // sizing on mobile that includes the address bar.
  return new XY(window.innerWidth, window.innerHeight)
}

// physical pixels
export function nativeViewportWH(
  window: Window,
  clientViewportWH: Readonly<XY>,
): XY {
  // These are physical pixels so rounding is correct.
  return new XY(
    clientViewportWH.x * window.devicePixelRatio,
    clientViewportWH.y * window.devicePixelRatio,
  ).round()
}

/**
 * A camera filling or just barely not filling the viewport in scaled pixels.
 * gets cam wh in level pixels
 * level wh
 */
export function camWH(
  nativeViewportWH: Readonly<XY>,
  scale: number,
): XY {
  return new XY(nativeViewportWH.x / scale, nativeViewportWH.y / scale)
    .floor()
}

/** Canvas must be an integer multiple of camera. */
export function nativeCanvasWH(camWH: Readonly<XY>, scale: number): XY {
  return new XY(camWH.x * scale, camWH.y * scale)
}

export function clientCanvasWH(
  window: Window,
  nativeCanvasWH: Readonly<XY>,
): XY {
  const ratio = window.devicePixelRatio
  return new XY(nativeCanvasWH.x / ratio, nativeCanvasWH.y / ratio)
}

/**
 * @arg point The viewport coordinates of the input in window pixels,
 *            usually new XY(event.clientX, event.clientY).
 * @arg cam The coordinates and dimensions of the camera the input was made
 *          through in level pixels.
 * @return The fractional position in level coordinates.
 */
export function viewportToLevelXY(
  point: Readonly<XY>,
  clientViewportWH: Readonly<XY>,
  cam: Readonly<Box>,
): XY {
  return new XY(
    cam.x + (point.x / clientViewportWH.x) * cam.w,
    cam.y + (point.y / clientViewportWH.y) * cam.h,
  )
}
