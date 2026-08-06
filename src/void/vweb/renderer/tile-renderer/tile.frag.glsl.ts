export const tileFrag: string = `#version 300 es
precision highp float;

uniform highp usampler2D uTiles;
uniform highp usampler2D uAtlasCels;
uniform highp sampler2D uSprsheet;
uniform highp vec2 uAtlasSize;
uniform highp vec4 uLevel; // xywh.
uniform highp vec2 uTileWH;
uniform highp float uNowMillis;

const highp uint animCelMask = 0xfu;
const highp float celsPerAnim = 16.;

in highp vec2 vPx;

out highp vec4 fragColor;

void main() {
  highp ivec2 gridWH = ivec2(uLevel.zw / uTileWH);
  highp ivec2 cell = ivec2(int(vPx.x / uTileWH.x), int(vPx.y / uTileWH.y));
  if (cell.x < 0 || cell.x >= gridWH.x ||
      cell.y < 0 || cell.y >= gridWH.y) discard;

  highp uint tile = texelFetch(uTiles, cell, 0).r;
  if (tile == 0u) discard;

  highp uint celI = uint(floor(uNowMillis * celsPerAnim / 1000.)) & animCelMask;
  highp uvec4 cel = texelFetch(uAtlasCels, ivec2(int(celI), int(tile)), 0);
  highp vec2 tilePx = floor(mod(vPx, uTileWH)) + .5;
  highp vec4 tex = texture(
    uSprsheet,
    (vec2(cel.xy) + mod(tilePx, vec2(cel.zw))) / uAtlasSize
  );
  if (tex.a == 0.) discard;
  fragColor = tex;
}
`
