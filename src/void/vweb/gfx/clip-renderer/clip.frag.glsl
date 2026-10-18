#version 300 es
precision highp float;

uniform mediump sampler2D uTex; // RGBA8 color.
uniform bool uDiscardTransparent;

in highp vec2 vUV;
out mediump vec4 fragColor;

void main() {
  mediump vec4 color = texture(uTex, vUV);
  if (uDiscardTransparent && color.a == 0.) discard;
  fragColor = color;
}
