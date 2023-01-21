import { I16, I16Box, I16XY, NumXY, U16XY } from '@/oidlib';

export namespace Viewport {
  /** @return The maximum scale possible. what to multiply level px's by to get native pixels */
  export function scale(
    nativeViewportWH: Readonly<U16XY>, // not canvas
    minViewportWH: Readonly<U16XY>,
    zoomOut: I16,
  ): I16 {
    const x = nativeViewportWH.x / minViewportWH.x;
    const y = nativeViewportWH.y / minViewportWH.y;
    return I16(Math.max(1, Math.floor(Math.min(x, y)) - zoomOut));
  }

  // returns wh of body in css px
  export function clientViewportWH(window: Window): NumXY {
    const { width, height } = window.document.body.getBoundingClientRect();
    return new NumXY(width, height);
  }

  // physical pixels
  export function nativeViewportWH(
    window: Window,
    clientViewportWH: Readonly<NumXY>,
  ): U16XY {
    // These are physical pixels so rounding is correct.
    return U16XY.round(
      clientViewportWH.x * window.devicePixelRatio,
      clientViewportWH.y * window.devicePixelRatio,
    );
  }

  /**
   * A camera filling or just barely not filling the viewport in scaled pixels.
   * gets cam wh in level pixels
   * level wh
   */
  export function camWH(
    nativeViewportWH: Readonly<U16XY>,
    scale: number,
  ): I16XY {
    return I16XY.floor(nativeViewportWH.x / scale, nativeViewportWH.y / scale);
  }

  /** Canvas must be an integer multiple of camera. */
  export function nativeCanvasWH(camWH: Readonly<I16XY>, scale: number): I16XY {
    return new I16XY(camWH.x * scale, camWH.y * scale);
  }

  export function clientCanvasWH(
    window: Window,
    nativeCanvasWH: Readonly<I16XY>,
  ): NumXY {
    const ratio = window.devicePixelRatio;
    return new NumXY(nativeCanvasWH.x / ratio, nativeCanvasWH.y / ratio);
  }

  /** @arg point The viewport coordinates of the input in window pixels,
                  usually new XY(event.clientX, event.clientY).
      @arg cam The coordinates and dimensions of the camera the input was made
               through in level pixels.
      @return The fractional position in level coordinates. */
  export function toLevelXY(
    point: Readonly<NumXY>,
    clientViewportWH: Readonly<NumXY>,
    cam: Readonly<I16Box>,
  ): I16XY {
    return I16XY.trunc(
      cam.x + (point.x / clientViewportWH.x) * cam.w,
      cam.y + (point.y / clientViewportWH.y) * cam.h,
    );
  }
}
