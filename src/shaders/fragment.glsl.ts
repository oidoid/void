export default `#version 300 es
#pragma debug(${debugGL ? 'on' : 'off'})
#pragma optimize(${debugGL ? 'off' : 'on'})

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#essl300_minimum_requirements_webgl_2
precision mediump int; // I16
precision mediump isampler2D; // U16
precision mediump usampler2D; // U16
precision highp float; // F32
precision highp sampler2D; // F32

uniform sampler2D uAtlas;
uniform uvec2 uAtlasSize; // width (x), height (y) in pixels.

/**
 * The destination width and height. These dimensions are negative when flipped.
 */
in vec2 vTargetWH;

/** Atlas position and dimensions. */
in vec4 vSourceXYWH;

/** Destination texture rotation offset. */
flat in ivec2 vWrapXY;

out vec4 frag;

void main() {
  // Wrap the target over the source to prevent scaling.
  vec2 sourceXY = vSourceXYWH.xy;
  vec2 sourceWH = vSourceXYWH.zw;
  vec2 px = sourceXY + mod(vTargetWH - vec2(vWrapXY), sourceWH);
  frag = texture(uAtlas, px / vec2(uAtlasSize));
  if(frag.a < 1.) discard;
}`

import { debugGL } from '@/void'
