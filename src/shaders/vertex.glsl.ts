export default `#version 300 es
#pragma debug(${debugGL ? 'on' : 'off'})
#pragma optimize(${debugGL ? 'off' : 'on'})

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#essl300_minimum_requirements_webgl_2
// todo: int is currently I32 but should be mediump (I16). However, that broke
// on Joie's phone.
precision highp int; // I32
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

// The atlas cel ID (index).
in uint iCelID;

// The rendered destination and dimensions in level pixel coordinates. x, y,
// scaled width (z) and scaled height (w) in pixels. When the destination width
// and height is not equal to the source width and height times scale, the
// rendered result is the source truncated or repeated. Width and height are
// negative when flipped.
in ivec4 iTarget;

in uint iFlipWrapAnchorLayer;

const uint FlipXMask = 1u;
const uint FlipXShift = 17u;
const uint FlipYMask = 1u;
const uint FlipYShift = 16u;
const uint WrapXMask = 0xfu;
const uint WrapXShift = 12u;
const uint WrapYMask = 0xfu;
const uint WrapYShift = 8u;
const uint LayerAnchorEndMask = 1u;
const uint LayerAnchorEndShift = 7u;
const uint LayerMask = 0x7fu;
const uint LayerShift = 0u;

// Only care about layer, height, and y. See
// https://www.patternsgameprog.com/opengl-2d-facade-25-get-the-z-of-a-pixel.
float zDepth() {
  const float maxLayer = 64.;
  const float maxY = 16. * 1024.;
  const float maxDepth = maxLayer * maxY;
  bool anchorEnd =
    ((iFlipWrapAnchorLayer >> LayerAnchorEndShift) & LayerAnchorEndMask) != 0u;
  float depth = float((iFlipWrapAnchorLayer >> LayerShift) & LayerMask) * maxY
    - float(iTarget.y + (anchorEnd ? 0 : iTarget.w));
  return depth / maxDepth;
}

out vec2 vTargetWH;
out vec4 vSourceXYWH;
flat out ivec2 vWrapXY;

void main() {
  uvec4 sourceXYWH = texelFetch(uSourceByCelID, ivec2(0, iCelID), 0);
  bool flipX = ((iFlipWrapAnchorLayer >> FlipXShift) & FlipXMask)!= 0u;
  bool flipY = ((iFlipWrapAnchorLayer >> FlipYShift) & FlipYMask)!= 0u;

  ivec2 targetWH = ivec2(vUV) * iTarget.zw;
  gl_Position = vec4(iTarget.xy + targetWH, zDepth(), 1) * uProjection;
  vTargetWH = vec2(targetWH.x * (flipX ? -1 : 1), targetWH.y * (flipY ? -1 : 1));
  vSourceXYWH = vec4(sourceXYWH);

  vWrapXY= ivec2((iFlipWrapAnchorLayer >> WrapXShift) & WrapXMask, (iFlipWrapAnchorLayer >> WrapYShift)& WrapYMask);
}`

import { debugGL } from '@/void'
