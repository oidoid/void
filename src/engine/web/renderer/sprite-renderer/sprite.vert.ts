export const spriteVert: string = `#version 300 es

uniform vec2 u_resolution;

layout(location=0) in vec2 a_uv;
layout(location=1) in vec2 a_xy;
layout(location=2) in float a_radius;
layout(location=3) in vec4 a_color;

out vec2 v_uv;
out vec4 v_color;

void main() {
  vec2 px = a_xy + a_uv * a_radius;
  vec2 ndc = px / u_resolution * 2. - 1.;
  ndc.y = -ndc.y;
  gl_Position = vec4(ndc, 0., 1.);

  v_uv = a_uv;
  v_color = a_color;
}
`
