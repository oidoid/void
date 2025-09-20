import {debug} from '../utils/debug.ts'

/** @internal */
export type GL2 = WebGL2RenderingContext
/** @internal */
export type GLProgram = WebGLProgram
/** @internal */
export type GLShader = WebGLShader
/** @internal */
export type GLTexture = WebGLTexture
/** @internal */
export type GLUniformLocation = WebGLUniformLocation
/** @internal */
export type GLUniformMap = {[name: string]: GLUniformLocation}

/** @internal */
export type Shader = {
  program: GLProgram | null
  buffer: WebGLBuffer | null
  uniform: GLUniformMap
  vao: WebGLVertexArrayObject | null
  textures: GLTexture[]
}

/** @internal */
export function Shader(
  gl: GL2,
  vertGLSL: string,
  fragGLSL: string,
  textures: GLTexture[]
): Shader {
  const program = loadProgram(gl, vertGLSL, fragGLSL)
  gl.useProgram(program)
  return {
    buffer: gl.createBuffer(),
    program,
    textures,
    uniform: GLUniformMap(gl, program),
    vao: gl.createVertexArray()
  }
}

function GLUniformMap(gl: GL2, pgm: GLProgram | null): GLUniformMap {
  const len = pgm ? gl.getProgramParameter(pgm, gl.ACTIVE_UNIFORMS) : 0
  const map = debug?.render
    ? new Proxy<GLUniformMap>(
        {},
        {
          get(target, k: string): GLUniformLocation {
            if (target[k] == null) throw Error(`no shader uniform "${k}"`)
            return target[k]
          }
        }
      )
    : {}
  for (let i = 0; i < len; ++i) {
    const uniform = gl.getActiveUniform(pgm!, i)
    if (!uniform) throw Error(`no shader uniform at index ${i}`)
    const location = gl.getUniformLocation(pgm!, uniform.name)
    if (!location) throw Error(`no shader uniform "${uniform.name}"`)
    const name = uniform.name.replace('[0]', '') // arrays.
    map[name] = location
  }
  return map
}

function loadProgram(
  gl: GL2,
  vertGLSL: string,
  fragGLSL: string
): GLProgram | null {
  const pgm = gl.createProgram()
  if (!pgm) return null

  const vert = compileShader(gl, 'VERTEX_SHADER', vertGLSL)
  const frag = compileShader(gl, 'FRAGMENT_SHADER', fragGLSL)
  if (!vert || !frag) return null
  gl.attachShader(pgm, vert)
  gl.attachShader(pgm, frag)
  gl.linkProgram(pgm)

  if (debug?.render && !gl.getProgramParameter(pgm, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(pgm)?.slice(0, -1)
    throw Error(`shader link failure; ${log}`)
  }

  gl.detachShader(pgm, frag)
  gl.detachShader(pgm, vert)
  gl.deleteShader(frag)
  gl.deleteShader(vert)

  return pgm
}

function compileShader(
  gl: GL2,
  type: 'FRAGMENT_SHADER' | 'VERTEX_SHADER',
  glsl: string
): GLShader | null {
  const shader = gl.createShader(gl[type])
  if (!shader) return shader
  gl.shaderSource(shader, glsl.trim())
  gl.compileShader(shader)

  if (debug?.render && !gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)?.slice(0, -1)
    throw Error(`shader compile failure; ${log}`)
  }

  return shader
}
