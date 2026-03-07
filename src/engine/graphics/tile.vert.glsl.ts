export const tileVertGLSL: string = `#version 300 es

precision highp int;
precision highp float;

uniform ivec4 uCam;

layout (location=0) in ivec2 iUV;

out vec2 vCam;

void main() {
  vec2 uv = vec2(iUV);
  vCam = uv * vec2(uCam.zw);

  vec2 clip = uv * 2. - 1.;
  clip.y *= -1.;
  gl_Position = vec4(clip, 0., 1.);
}
`
