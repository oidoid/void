export const spriteFragGLSL: string = `#version 300 es
#pragma debug(${debug?.render ? 'on' : 'off'})   
#pragma optimize(${debug?.render ? 'off' : 'on'})

uniform mediump sampler2D uTex;
uniform mediump uvec2 uTexWH;

flat in mediump ivec4 vTexXYWH;
flat in lowp int vZ;
in highp vec2 vDstWH;

out highp vec4 oRGBA;

void main() {
  if (vZ == ${Layer.Hidden}) discard;
  highp vec2 px = vec2(vTexXYWH.xy ) + mod(vDstWH, vec2(vTexXYWH.zw));
  oRGBA = texture(uTex, px / vec2(uTexWH));
  if(oRGBA.a < .001) discard;
}
`

import {debug} from '../types/debug.ts'
import {Layer} from './layer.ts'
