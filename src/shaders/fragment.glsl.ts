export default `#version 300 es
#pragma debug(${GL.debug ? 'on' : 'off'})
#pragma optimize(${GL.debug ? 'off' : 'on'})

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#essl300_minimum_requirements_webgl_2
precision mediump int; // I16
precision mediump isampler2D; // U16
precision mediump usampler2D; // U16
precision highp float; // F32
precision highp sampler2D; // F32

uniform sampler2D uAtlas;

uniform uvec2 uAtlasSize; // width (x), height (y) in pixels.

in vec2 vSource;
in vec4 vSourceXYWH;
flat in uint oLayer;

out vec4 frag;

void main() {
  int xOffset = int((oLayer >> 12)& 0xfu);
  int yOffset = int((oLayer >> 8)& 0xfu);
  // Wrap the target over the source to prevent scaling.
  frag = texture(uAtlas, (vSourceXYWH.xy + mod(vSource.xy - vec2(xOffset,yOffset), vSourceXYWH.zw)) / vec2(uAtlasSize));
  if(frag.a < 1.) discard;
}`;

import { GL } from '@/void';
