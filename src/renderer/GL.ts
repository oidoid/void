import { ShaderLayout } from '@/void';
import { assertNonNull, NonNull } from '@/oidlib';

declare global {
  type GL = WebGL2RenderingContext;
  type GLBuffer = WebGLBuffer | null;
  type GLBufferData = Parameters<GL['bufferData']>[1];
  type GLDataType =
    | 'BYTE'
    | 'UNSIGNED_BYTE'
    | 'SHORT'
    | 'UNSIGNED_SHORT'
    | 'INT'
    | 'UNSIGNED_INT'
    | 'FLOAT';
  type GLLoseContext = WEBGL_lose_context | null;
  type GLProgram = WebGLProgram | null;
  type GLShader = WebGLShader;
  type GLTexture = WebGLTexture | null;
  type GLUniformLocation = WebGLUniformLocation | null;
}

export namespace GL {
  export const debug = true;

  export function initAttribute(
    gl: GL,
    stride: number,
    divisor: number,
    buffer: GLBuffer,
    location: number,
    attrib: ShaderLayout.Attribute,
  ): void {
    gl.enableVertexAttribArray(location);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribIPointer(
      location,
      attrib.len,
      gl[attrib.type],
      stride,
      attrib.offset,
    );
    gl.vertexAttribDivisor(location, divisor);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  export function loadProgram(
    gl: GL,
    vertexGLSL: string,
    fragmentGLSL: string,
  ): GLProgram {
    const program = gl.createProgram();
    if (program == null) return null;

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexGLSL);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentGLSL);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const log = gl.getProgramInfoLog(program);
    if (log) console.info(log);

    // Mark shaders for deletion when unused.
    gl.detachShader(program, fragmentShader);
    gl.detachShader(program, vertexShader);
    gl.deleteShader(fragmentShader);
    gl.deleteShader(vertexShader);

    return program;
  }

  export function compileShader(
    gl: GL,
    type: number,
    source: string,
  ): GLShader {
    const shader = gl.createShader(type);
    assertNonNull(shader, 'Shader creation failed.');

    gl.shaderSource(shader, source.trim());
    gl.compileShader(shader);

    const log = gl.getShaderInfoLog(shader);
    if (log) console.info(log);

    return shader;
  }

  export function bufferData(
    gl: GL,
    buffer: GLBuffer,
    data: GLBufferData,
    usage: number,
  ): void {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  export function loadTexture(
    gl: GL,
    textureUnit: number,
    image: TexImageSource,
  ): GLTexture {
    gl.activeTexture(textureUnit);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    return texture;
  }

  export function loadDataTexture(
    gl: GL,
    textureUnit: number,
    internalFormat: GLint,
    width: GLsizei,
    height: GLsizei,
    format: GLenum,
    type: GLenum,
    dat: ArrayBufferView,
  ): GLTexture {
    gl.activeTexture(textureUnit);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      width,
      height,
      0,
      format,
      type,
      dat,
    );
    return texture;
  }

  export function uniformLocations(
    gl: GL,
    program: GLProgram,
  ): Readonly<{ [name: string]: GLUniformLocation }> {
    if (program == null) return {};
    const len = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    const locations: { [name: string]: GLUniformLocation } = {};
    for (let i = 0; i < len; ++i) {
      const uniform = gl.getActiveUniform(program, i);
      assertNonNull(uniform, `Missing shader uniform at index ${i}.`);
      locations[uniform.name] = gl.getUniformLocation(program, uniform.name);
    }
    return locations;
  }

  export function uniformLocation(
    layout: ShaderLayout,
    uniforms: Readonly<{ [name: string]: GLUniformLocation }>,
    name: string,
  ): GLUniformLocation {
    return NonNull(uniforms[NonNull(layout.uniforms[name])]);
  }

  export function attributeLocations(
    gl: GL,
    program: GLProgram,
  ): Readonly<{ [name: string]: number }> {
    if (program == null) return {};
    const len = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    const locations: { [name: string]: number } = {};
    for (let i = 0; i < len; ++i) {
      const attr = gl.getActiveAttrib(program, i);
      assertNonNull(attr, `Missing shader attribute at index ${i}.`);
      locations[attr.name] = gl.getAttribLocation(program, attr.name);
    }
    return locations;
  }
}
