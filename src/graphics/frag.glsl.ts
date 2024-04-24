import {debug} from '../types/debug.js'

export const fragGLSL = `#version 300 es
#pragma debug(${debug ? 'on' : 'off'})
#pragma optimize(${debug ? 'off' : 'on'})
uniform mediump sampler2D uAtlas;
uniform mediump uvec2 uAtlasWH;

flat in highp ivec4 vTexXYWH;
in highp vec2 vDstWH;

out highp vec4 oFrag;

void main() {
  highp vec2 px = vec2(vTexXYWH.xy) + mod(vDstWH, vec2(vTexXYWH.zw));
  oFrag = texture(uAtlas, px / vec2(uAtlasWH));
  if(oFrag.a < 1.) discard;
}`
