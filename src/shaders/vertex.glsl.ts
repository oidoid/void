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

in uint iWrapLayerByHeightLayer;

// to-do: make this style match Bitmap
const uint LayerByHeightFlag = 1u << 7;
const uint LayerMask = 0x007fu;
const uint LayerByHeightMask = LayerByHeightFlag;
const uint LayerByHeightFlagStart = LayerByHeightMask & ~LayerByHeightFlag; // to-do: use consistent terminology
const uint LayerByHeightFlagEnd = LayerByHeightMask & LayerByHeightFlag;

// Only care about layer, height, and y. See
// https://www.patternsgameprog.com/opengl-2d-facade-25-get-the-z-of-a-pixel.
float zDepth() {
  const float maxLayer = 64.;
  const float maxY = 16. * 1024.;
  const float maxDepth = maxLayer * maxY;
  bool layerByHeight =
    (iWrapLayerByHeightLayer & LayerByHeightMask) == LayerByHeightFlagStart;
  float depth = float(iWrapLayerByHeightLayer & LayerMask) * maxY
    - float(iTarget.y + (layerByHeight ? iTarget.w : 0));
  return depth / maxDepth;
}

out vec2 vTargetWH;
out vec4 vSourceXYWH;
flat out ivec2 vWrapXY;

void main() {
  uvec4 sourceXYWH = texelFetch(uSourceByCelID, ivec2(0, iCelID), 0);

  ivec2 targetWH = ivec2(vUV) * iTarget.zw;
  gl_Position = vec4(iTarget.xy + abs(targetWH), zDepth(), 1) * uProjection;
  vTargetWH = vec2(targetWH);
  vSourceXYWH = vec4(sourceXYWH);

  vWrapXY= ivec2((iWrapLayerByHeightLayer >> 12)& 0xfu, (iWrapLayerByHeightLayer >> 8)& 0xfu);
}`

import { debugGL } from '@/void'
