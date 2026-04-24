export function buildProgram(
  gl: WebGL2RenderingContext,
  vertSrc: string,
  fragSrc: string
): WebGLProgram {
  const pgm = gl.createProgram()!
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc)
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc)
  gl.attachShader(pgm, vert)
  gl.attachShader(pgm, frag)
  gl.linkProgram(pgm)
  gl.detachShader(pgm, vert)
  gl.detachShader(pgm, frag)
  gl.deleteShader(vert)
  gl.deleteShader(frag)
  // to-do: `debug?.render && `.
  if (!gl.getProgramParameter(pgm, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(pgm)?.slice(0, -1)
    throw Error(`shader link failure; ${log}`)
  }
  return pgm
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  src: string
): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  // to-do: `debug?.render && `.
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)?.slice(0, -1)
    throw Error(`shader compile failure; ${log}`)
  }
  return shader
}
