export default `#version 300 es
#pragma debug(${GL.debug ? 'on' : 'off'})
#pragma optimize(${GL.debug ? 'off' : 'on'})

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#essl300_minimum_requirements_webgl_2
precision highp int; // I16 wutttttt this broke on my partner's phone
precision mediump isampler2D; // U16
precision mediump usampler2D; // U16
precision highp float; // F32
precision highp sampler2D; // F32

// The camera projection in pixels.
uniform mat4 uProjection;

// The atlas spritesheet.
uniform sampler2D uAtlas;

// The atlas cel ID to subimage box coordinate. Each row is x, y, width (z), and
// height (w) in pixels.
uniform usampler2D uSourceByCelID;

// Each vertex of a two triangle strip in a unit square (each x/y is either 0 or
// 1). Multiplying a width and height against the UV coordinates gives the
// bounding box.
in uvec2 vUV;

// The atlas cel ID.
in uint iCelID;

// The rendered destination and dimensions in level pixel coordinates. x, y,
// scaled width (z) and scaled height (w) in pixels. When the destination width
// and height is not equal to the source width and height times scale, the
// rendered result is the source truncated or repeated.
in ivec4 iTarget;

in uint iLayer;


const uint LayerSuborderFlag = 1u << 7;
const uint LayerMask = 0x00ffu;
const uint LayerSuborderMask = LayerSuborderFlag;
const uint LayerSuborderFlagStart = LayerSuborderMask & LayerSuborderFlag;
const uint LayerSuborderFlagEnd = LayerSuborderMask & ~LayerSuborderFlag;

// For picking, only care about layer and (y + h).
float z_depth() {
  const float maxLayer = 64.;
  const float maxY = 16. * 1024.;
  const float maxDepth = maxLayer * maxY;
  bool byStart = (iLayer & LayerSuborderMask) == LayerSuborderFlagStart;
  float depth = float(iLayer & ~LayerSuborderMask & LayerMask) * maxY  - float(iTarget.y + (byStart ? 0 : iTarget.w));
  return depth / maxDepth;
}

out vec2 vSource;
out vec4 vSourceXYWH;
flat out uint oLayer;

void main() {
  uvec4 sourceXYWH = texelFetch(uSourceByCelID, ivec2(0, iCelID), 0);

  gl_Position = vec4(iTarget.xy + ivec2(vUV) * iTarget.zw, z_depth(), 1) * uProjection;
  vSource = vec2(vUV) * vec2(iTarget.zw);
  vSourceXYWH = vec4(sourceXYWH);
  oLayer = iLayer;
}`;

import { GL } from '@/void';
