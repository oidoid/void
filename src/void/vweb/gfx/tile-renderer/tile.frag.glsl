#version 300 es
precision highp float;

uniform highp usampler2D uTiles;
uniform highp usampler2D uAtlas;
uniform mediump sampler2D uSprsheet; // RGBA8 color.
uniform highp vec2 uBoardWH;
uniform highp vec2 uTileWH;

in highp vec2 vPx;

out mediump vec4 fragColor;

const highp uint tileTagMask = 0xfffu;
const highp uint tileTagShift = 0u;

// a texel is four uint16 channels: two tag offsets, or one cel's `XYWH`.
highp uvec4 atlasTexel(highp uint i) {
  highp uint w = uint(textureSize(uAtlas, 0).x);
  return texelFetch(uAtlas, ivec2(int(i % w), int(i / w)), 0);
}

highp uvec4 atlasCel(highp uint tag, highp uint cel) {
  highp uvec4 offsets = atlasTexel(tag / 2u);
  highp uvec2 offset = (tag & 1u) == 0u ? offsets.xy : offsets.zw;
  return atlasTexel((offset.x | (offset.y << 16u)) + cel);
}

void main() {
  highp ivec2 gridWH = ivec2(uBoardWH / uTileWH);
  highp ivec2 cell = ivec2(int(vPx.x / uTileWH.x), int(vPx.y / uTileWH.y));
  if (cell.x < 0 || cell.x >= gridWH.x ||
      cell.y < 0 || cell.y >= gridWH.y) discard;

  highp uint tile = (texelFetch(uTiles, cell, 0).r >> tileTagShift) & tileTagMask;
  if (tile == 0u) discard;

  // tile animations only contain cel zero.
  highp uvec4 cel = atlasCel(tile, 0u);
  highp ivec2 tilePx = ivec2(floor(mod(vPx, uTileWH)));
  mediump vec4 tex = texelFetch(uSprsheet, ivec2(cel.xy) + tilePx, 0);
  if (tex.a == 0.) discard;
  fragColor = tex;
}
