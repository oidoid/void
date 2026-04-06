export const spriteFrag: string = `#version 300 es
precision mediump float;

in vec2 v_uv;
in vec4 v_color;

out vec4 fragColor;

void main() {
  if (dot(v_uv, v_uv) > 1.) discard;
  fragColor = v_color;
}
`
