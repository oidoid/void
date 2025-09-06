export const spriteVertGLSL: string = `#version 300 es
#pragma debug(${debug?.render ? 'on' : 'off'})   
#pragma optimize(${debug?.render ? 'off' : 'on'})

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#essl300_minimum_requirements_webgl_2

uniform highp ivec4 uCam;
uniform lowp usampler2D uCels;
uniform highp float uAge;

layout (location=0) in lowp ivec2 iUV;
layout (location=1) in highp uint iy12_x20;
layout (location=2) in highp uint ih4_w12_sxyz_llll_y8;
layout (location=3) in highp uint ir9_i10_5c_8h;

const mediump int maxY = 0x1000;
const lowp int layers = 16;
const mediump int maxDepth = maxY * layers;

flat out lowp uint vStretch;
flat out mediump ivec4 vTexXYWH;
flat out lowp int vZ;
out highp vec2 vDstWH;
flat out highp ivec2 vDstWHFixed;

void main() {
  highp int x = (int(iy12_x20 << 12) >> 12) / 8;
  highp int y = int(((ih4_w12_sxyz_llll_y8 << 24) >> 12) | (iy12_x20 >> 20)) / 8;
  lowp int z = int((ih4_w12_sxyz_llll_y8 >> 8) & 0xfu);
  bool zend = bool(ih4_w12_sxyz_llll_y8 & 0x1000u);
  bool flipX = bool(ih4_w12_sxyz_llll_y8 & 0x4000u);
  bool flipY = bool(ih4_w12_sxyz_llll_y8 & 0x2000u);
  bool stretch = bool(ih4_w12_sxyz_llll_y8 & 0x8000u);
  mediump int id = int((ir9_i10_5c_8h >> 9) & 0x3ff0u);
  lowp int cel = int((ir9_i10_5c_8h >> 8) & 0xfu); // ignore the MSB.
  mediump int w = int(ih4_w12_sxyz_llll_y8 << 4 >> 20);
  mediump int h = int((ir9_i10_5c_8h << 24 >> 20) | (ih4_w12_sxyz_llll_y8 >> 28));

  // https://www.patternsgameprog.com/opengl-2d-facade-25-get-the-z-of-a-pixel
  highp float depth = float((z + 1) * maxY - (y + (zend ? 0 : h))) / float(maxDepth);

  highp ivec2 targetWH = iUV * ivec2(w, h);

  highp vec2 end = vec2(x + targetWH.x, y + targetWH.y);
  // UI layers are always given in screen coordinates.
  // to-do: how to handle non-int mode?
  highp vec2 camXY = z <= ${Layer.UIBottom} ? vec2(0, 0) : vec2(uCam.xy);
  highp vec2 clip = ((-2. * camXY  + 2. * end) / vec2(uCam.zw) - 1.) * vec2(1, -1);
  gl_Position = vec4(clip, depth, 1);

  lowp int frame = (((int(uAge / ${celMillis}) & 0x1f) - cel) + ${animCels}) & 0xf;
  mediump uvec4 texXYWH = texelFetch(uCels, ivec2(0, id + frame), 0);
  vTexXYWH = ivec4(texXYWH);
  vZ = z;

  vDstWH = vec2(targetWH * ivec2(flipX ? -1 : 1, flipY ? -1 : 1));
  vDstWHFixed = ivec2(w, h) * ivec2(flipX ? -1 : 1, flipY ? -1 : 1);

  vStretch = stretch ? 1u : 0u;
}
`

import {debug} from '../types/debug.ts'
import {animCels, celMillis} from './atlas.ts'
import {Layer} from './layer.ts'
