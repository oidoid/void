export const fragGLSL = `#version 300 es
uniform mediump sampler2D uSpritesheet;
uniform mediump uvec2 uSpritesheetSize;

flat in highp ivec4 vTexXYWH;
in highp vec2 vDstWH;

out highp vec4 oFrag;

void main() {
  highp vec2 px = vec2(vTexXYWH.xy) + mod(vDstWH, vec2(vTexXYWH.zw));
  oFrag = texture(uSpritesheet, px / vec2(uSpritesheetSize));
  if(oFrag.a < 1.) discard;
}`
