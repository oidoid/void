export const spriteFragGLSL: string = `#version 300 es
#pragma debug(${debug?.render ? 'on' : 'off'})   
#pragma optimize(${debug?.render ? 'off' : 'on'})

uniform mediump sampler2D uTex;
uniform mediump uvec2 uTexWH;

flat in mediump ivec4 vTexXYWH;
in highp vec2 vDstWH;

out highp vec4 oRGBA;

void main() {
  highp vec2 srcWH = vec2(vTexXYWH.zw);
  highp vec2 px = vec2(vTexXYWH.xy ) + mod(vDstWH, srcWH);
  oRGBA = texture(uTex, px / vec2(uTexWH));
  if(oRGBA.a < .001) discard;
}
`

import {debug} from '../types/debug.js'
