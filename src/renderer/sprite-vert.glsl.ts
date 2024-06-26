export const spriteVertGLSL: string = `#version 300 es
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#essl300_minimum_requirements_webgl_2
uniform mediump ivec4 uCam;
uniform lowp usampler2D uCels;
uniform highp uint uFrame;

layout (location=0) in lowp ivec2 iUV;
layout (location=1) in highp uint iXY;
layout (location=2) in highp uint iWH;
layout (location=3) in highp uint iIFFZZ;

flat out highp ivec4 vTexXYWH;
out highp vec2 vDstWH;

const mediump int maxY = 0x1000;
const lowp int maxZ = 8;
const mediump int maxDepth = maxY * maxZ;

void main() {
  mediump int x = int(iXY) >> 19;
  mediump int y = int(iXY << 16) >> 19;
  lowp int z = int(iIFFZZ & 0x7u);
  bool zend = bool(iIFFZZ & 0x8u);
  bool flipX = bool(iIFFZZ & 0x20u);
  bool flipY = bool(iIFFZZ & 0x10u);
  mediump int id = int((iIFFZZ >> 6) & 0x7ff0u);
  lowp int cel = int((iIFFZZ >> 6) & 0xfu);
  mediump int w = int((iWH >> 12) & 0xfffu);
  mediump int h = int(iWH & 0xfffu);

  lowp int frame = ((int(uFrame) - cel) / 4) & 0xf;
  mediump uvec4 texXYWH = texelFetch(uCels, ivec2(0, id + frame), 0);

  // https://www.patternsgameprog.com/opengl-2d-facade-25-get-the-z-of-a-pixel
  highp float depth = float((z + 1) * maxY - (y + (zend ? 0 : h))) / float(maxDepth);

  highp ivec2 targetWH = ivec2(iUV) * ivec2(w, h);
  highp ivec2 origWH = ivec2(iUV) * ivec2(texXYWH.zw);

  highp vec2 end = vec2(x + targetWH.x, y + targetWH.y);
  highp vec2 clip =  ((-2. * vec2(uCam.xy)  + 2. * end) / vec2(uCam.zw) - 1.) * vec2(1, -1);
  gl_Position = vec4(clip, depth, 1);
  vTexXYWH = ivec4(texXYWH);
  vDstWH = vec2(targetWH * ivec2(flipX ? -1 : 1, flipY ? -1 : 1));
}`
