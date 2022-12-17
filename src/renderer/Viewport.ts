import { I16, I16Box, I16XY, NumberXY, U16XY } from '@/oidlib';

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
  export function clientViewportWH(window: Window): NumberXY {
    const { width, height } = window.document.body.getBoundingClientRect();
    return NumberXY(width, height);
  }

  // physical pixels
  export function nativeViewportWH(
    window: Window,
    clientViewportWH: Readonly<NumberXY>,
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
    return I16XY(camWH.x * scale, camWH.y * scale);
  }

  export function clientCanvasWH(
    window: Window,
    nativeCanvasWH: Readonly<I16XY>,
  ): NumberXY {
    const ratio = window.devicePixelRatio;
    return NumberXY(nativeCanvasWH.x / ratio, nativeCanvasWH.y / ratio);
  }

  /** @arg point The viewport coordinates of the input in window pixels,
                  usually new XY(event.clientX, event.clientY).
      @arg cam The coordinates and dimensions of the camera the input was made
               through in level pixels.
      @return The fractional position in level coordinates. */
  export function toLevelXY(
    point: Readonly<NumberXY>,
    clientViewportWH: Readonly<NumberXY>,
    cam: Readonly<I16Box>,
  ): I16XY {
    return I16XY.trunc(
      cam.start.x + (point.x / clientViewportWH.x) * I16Box.width(cam),
      cam.start.y + (point.y / clientViewportWH.y) * I16Box.height(cam),
    );
  }
}
