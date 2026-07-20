export const tileFrag: string = `#version 300 es

uniform highp usampler2D uTiles;
uniform highp usampler2D uAtlasCels;
uniform highp sampler2D uSpritesheet;
uniform highp vec2 uAtlasSize;
uniform highp vec4 uLevel; // xywh.
uniform highp vec2 uTileWH;

in highp vec2 vPx;

out highp vec4 fragColor;

void main() {
  highp ivec2 gridWH = ivec2(uLevel.zw / uTileWH);
  highp ivec2 cell = ivec2(int(vPx.x / uTileWH.x), int(vPx.y / uTileWH.y));
  if (cell.x < 0 || cell.x >= gridWH.x ||
      cell.y < 0 || cell.y >= gridWH.y) discard;

  highp uint tile = texelFetch(uTiles, cell, 0).r;
  if (tile == 0u) discard;

  highp uvec4 cel = texelFetch(uAtlasCels, ivec2(0, int(tile)), 0);
  highp vec2 tilePx = floor(mod(vPx, uTileWH)) + .5;
  highp vec4 tex = texture(
    uSpritesheet,
    (vec2(cel.xy) + mod(tilePx, vec2(cel.zw))) / uAtlasSize
  );
  if (tex.a == 0.) discard;
  fragColor = tex;
}
`
