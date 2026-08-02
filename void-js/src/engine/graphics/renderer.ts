  /** when off, ents should avoid requesting renders. */
  always: boolean = debug?.render === 'always'
  /** number of clears performed. often used to count render passes. */
  clears: number = 0





function GL2(canvas: HTMLCanvasElement, always: boolean): GL2 | undefined {
  const gl =
    canvas.getContext('webgl2', {
      // to-do: expose with Int / Frac mode.
      antialias: false,
      powerPreference: 'low-power',
      // avoid flicker caused by clearing the drawing buffer. see
      // https://developer.chrome.com/blog/desynchronized/.
      preserveDrawingBuffer: true,
      // disable desync in debug since it breaks FPS meter. only enable
      // when canvas is known to draw next frame.
      ...(!debug?.render && {desynchronized: always})
    }) ?? undefined
  if (!gl) console.debug('[render] no GL context')

  return gl
}

function isWebGL2Supported(): boolean {
  if (typeof document === 'undefined') return true // for tests.
  return document.createElement('canvas').getContext('webgl2') != null
}
