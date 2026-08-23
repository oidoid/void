export const tileFrag: string = `#version 300 es
precision highp float;

uniform highp usampler2D uTiles;
uniform highp usampler2D uAtlasCels;
uniform highp sampler2D uSprsheet;
uniform highp vec2 uLevelWH;
uniform highp vec2 uTileWH;

in highp vec2 vPx;

out highp vec4 fragColor;

void main() {
  highp ivec2 gridWH = ivec2(uLevelWH / uTileWH);
  highp ivec2 cell = ivec2(int(vPx.x / uTileWH.x), int(vPx.y / uTileWH.y));
  if (cell.x < 0 || cell.x >= gridWH.x ||
      cell.y < 0 || cell.y >= gridWH.y) discard;

  highp uint tile = texelFetch(uTiles, cell, 0).r;
  if (tile == 0u) discard;

  // tile animations only contain cel zero.
  highp uvec4 cel = texelFetch(uAtlasCels, ivec2(0, int(tile)), 0);
  highp ivec2 tilePx = ivec2(floor(mod(vPx, uTileWH)));
  highp vec4 tex = texelFetch(uSprsheet, ivec2(cel.xy) + tilePx, 0);
  if (tex.a == 0.) discard;
  fragColor = tex;
}
`
