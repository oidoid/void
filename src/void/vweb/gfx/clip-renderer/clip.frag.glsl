#version 300 es
precision highp float;

uniform mediump sampler2D uTex; // RGBA8 color.
uniform bool uDiscardTransparent;
// last texel centers of the layer's sub-rectangle;.
uniform highp vec2 uUVMax;

in highp vec2 vUV;
out mediump vec4 fragColor;

void main() {
  mediump vec4 color = texture(uTex, min(vUV, uUVMax));
  if (uDiscardTransparent && color.a == 0.) discard;
  fragColor = color;
}
