export const spriteFrag: string = `#version 300 es

in highp vec2 vUV;
in highp vec4 vColor;

out highp vec4 fragColor;

void main() {
  if (dot(vUV, vUV) > 1.) discard;
  fragColor = vColor;
}
`
