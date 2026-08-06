export const clipFrag: string = `#version 300 es
precision highp float;

uniform highp sampler2D uTex;
uniform bool uDiscardTransparent;

in highp vec2 vUV;
out highp vec4 fragColor;

void main() {
  highp vec4 color = texture(uTex, vUV);
  if (uDiscardTransparent && color.a == 0.) discard;
  fragColor = color;
}
`
