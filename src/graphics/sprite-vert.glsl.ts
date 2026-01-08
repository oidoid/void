export const spriteVertGLSL: string = `#version 300 es
#pragma debug(${debug?.render ? 'on' : 'off'})
#pragma optimize(${debug?.render ? 'off' : 'on'})

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#essl300_minimum_requirements_webgl_2
precision highp int;
precision highp float;
precision highp usampler2D;

uniform ivec4 uCam;
uniform usampler2D uCels;
uniform float uAge;

layout (location=0) in ivec2 iUV;
layout (location=1) in uint iy8_x24;
layout (location=2) in uint iw8_sxyz_llll_y16;
layout (location=3) in uint ii11_c5_h12_w4;
layout (location=4) in uint ia12_r19_v;

const int maxY = 0x20000;
const int layers = 16;
const int maxDepth = maxY * layers;
const float pi = 3.1415926535897932384626433832795;

flat out float vAngle; // in radians.
flat out vec2 vAABBWH;
flat out vec2 vSpriteWH;
flat out uint vStretch;
flat out ivec4 vTexXYWH;
flat out uint vHidden;
out vec2 vDstWH;
flat out ivec2 vDstWHFixed;

void main() {
  int x = int(floor(float(int((iy8_x24 & 0xffffffu) << 8) >> 8) / 64.));
  int y = int(floor(float(int(iy8_x24 >> 24) | (int(iw8_sxyz_llll_y16 & 0xffffu) << 16 >> 8)) / 64.));
  int z = int((iw8_sxyz_llll_y16 >> 16) & 0xfu);
  bool zend = bool(iw8_sxyz_llll_y16 & 0x100000u);
  bool flipY = bool(iw8_sxyz_llll_y16 & 0x200000u);
  bool flipX = bool(iw8_sxyz_llll_y16 & 0x400000u);
  bool stretch = bool(iw8_sxyz_llll_y16 & 0x800000u);
  int id = int((ii11_c5_h12_w4 >> 17) & 0x7ff0u); // ignore cel.
  int cel = int((ii11_c5_h12_w4 >> 16) & 0xfu); // ignore the MSB.
  int w = int(((ii11_c5_h12_w4 & 0xfu) << 8) | (iw8_sxyz_llll_y16 >> 24));
  int h = int((ii11_c5_h12_w4 >> 4) & 0xfffu);
  bool hidden = bool(ia12_r19_v & 0x1u);
  int angle = int((ia12_r19_v >> 8) & 0xfffu);

  // https://www.patternsgameprog.com/opengl-2d-facade-25-get-the-z-of-a-pixel
  float depth = float((${Layer.Top} - z + 1) * maxY - (y + (zend ? 0 : h))) / float(maxDepth);

  vSpriteWH = vec2(float(w), float(h));

  vec2 end;
  vec2 targetWH;
  if (angle == 0) {
    vAngle = 0.;
    targetWH = vec2(iUV * ivec2(w, h));
    end = vec2(x + int(targetWH.x), y + int(targetWH.y));

    vAABBWH = vec2(float(w), float(h));
    vDstWHFixed = ivec2(w, h) * ivec2(flipX ? -1 : 1, flipY ? -1 : 1);
  } else {
    vAngle = float(angle) * 2. * pi / 4096.;
    float cosAngle = cos(vAngle);
    float sinAngle = sin(vAngle);

    vec2 halfWH = vSpriteWH / 2.;

    vec2 center = vec2(floor(float(x) + halfWH.x), floor(float(y) + halfWH.y));

    vec2 aabbHalf = vec2(abs(cosAngle) * halfWH.x + abs(sinAngle) * halfWH.y,
                         abs(sinAngle) * halfWH.x + abs(cosAngle) * halfWH.y);
    vec2 aabbWH = aabbHalf * 2.;

    vec2 aabbOrigin = center - aabbHalf;

    targetWH = vec2(iUV) * aabbWH;
    end = aabbOrigin + targetWH;

    vAABBWH = aabbWH;
    vDstWHFixed = ivec2(floor(aabbWH)) * ivec2(flipX ? -1 : 1, flipY ? -1 : 1);
  }
  // UI layers are always given in screen coordinates.
  // to-do: how to handle non-int mode?
  vec2 camXY = z >= ${Layer.UIA} ? vec2(0, 0) : vec2(uCam.xy);
  vec2 clip = ((-2. * camXY  + 2. * end) / vec2(uCam.zw) - 1.) * vec2(1, -1);
  gl_Position = vec4(clip, depth, 1);

  int frame = (((int(uAge / ${celMillis}) & 0x1f) - cel) + ${animCels}) & 0xf;
  uvec4 texXYWH = texelFetch(uCels, ivec2(0, id + frame), 0);
  vTexXYWH = ivec4(texXYWH);
  vHidden = uint(hidden);

  vec2 flipSign = vec2(flipX ? -1. : 1., flipY ? -1. : 1.);
  vDstWH = targetWH * flipSign;

  vStretch = stretch ? 1u : 0u;
}
`

import {debug} from '../utils/debug.ts'
import {animCels, celMillis} from './atlas.ts'
import {Layer} from './layer.ts'
