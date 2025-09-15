export const spriteVertGLSL: string = `#version 300 es
#pragma debug(${debug?.render ? 'on' : 'off'})   
#pragma optimize(${debug?.render ? 'off' : 'on'})

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#essl300_minimum_requirements_webgl_2

uniform highp ivec4 uCam;
uniform lowp usampler2D uCels;
uniform highp float uAge;

layout (location=0) in lowp ivec2 iUV;
layout (location=1) in highp uint iy8_x24;
layout (location=2) in highp uint iw8_sxyz_llll_y16;
layout (location=3) in highp uint ii11_c5_h12_w4;

const highp int maxY = 0x20000;
const lowp int layers = 16;
const highp int maxDepth = maxY * layers;

flat out lowp uint vStretch;
flat out mediump ivec4 vTexXYWH;
flat out lowp int vZ;
out highp vec2 vDstWH;
flat out highp ivec2 vDstWHFixed;

void main() {
  highp int x = (int((iy8_x24 & 0xffffffu) << 8) >> 8) / 64;
  highp int y = (int(iy8_x24 >> 24) | (int(iw8_sxyz_llll_y16 & 0xffffu) << 16 >> 8)) / 64;
  lowp int z = int((iw8_sxyz_llll_y16 >> 16) & 0xfu);
  bool zend = bool(iw8_sxyz_llll_y16 & 0x100000u);
  bool flipY = bool(iw8_sxyz_llll_y16 & 0x200000u);
  bool flipX = bool(iw8_sxyz_llll_y16 & 0x400000u);
  bool stretch = bool(iw8_sxyz_llll_y16 & 0x800000u);
  mediump int id = int((ii11_c5_h12_w4 >> 17) & 0x7ff0u); // ignore cel.
  lowp int cel = int((ii11_c5_h12_w4 >> 16) & 0xfu); // ignore the MSB.
  mediump int w = int(((ii11_c5_h12_w4 & 0xfu) << 8) | (iw8_sxyz_llll_y16 >> 24));
  mediump int h = int((ii11_c5_h12_w4 >> 4) & 0xfffu);

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
