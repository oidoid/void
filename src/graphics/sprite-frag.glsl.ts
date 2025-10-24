export const spriteFragGLSL: string = `#version 300 es
#pragma debug(${debug?.render ? 'on' : 'off'})
#pragma optimize(${debug?.render ? 'off' : 'on'})

precision highp int;
precision highp float;
precision highp usampler2D;

uniform sampler2D uTex;
uniform uvec2 uTexWH;

flat in uint vStretch;
flat in ivec4 vTexXYWH;
flat in int vZ;
in vec2 vDstWH;
flat in ivec2 vDstWHFixed;

out vec4 oRGBA;

void main() {
  if (vZ == ${Layer.Hidden} || vDstWHFixed.x == 0 || vDstWHFixed.y == 0)
    discard;

  vec2 px = vec2(vTexXYWH.xy) + (
    vStretch == 1u ? (vDstWH * vec2(vTexXYWH.zw) / vec2(vDstWHFixed))
                   : mod(vDstWH, vec2(vTexXYWH.zw))
  );

  oRGBA = texture(uTex, px / vec2(uTexWH));
  if(oRGBA.a < .001) discard;
}
`

import {debug} from '../utils/debug.ts'
import {Layer} from './layer.ts'
