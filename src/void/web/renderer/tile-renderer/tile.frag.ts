export const tileFrag: string = `#version 300 es

uniform highp usampler2D uTiles;
uniform highp vec4 uLevel; // xywh.
uniform highp vec2 uTileWH;

in highp vec2 vPx;

out highp vec4 fragColor;

const highp vec3 palette[8] = vec3[8](
  vec3(0.),
  vec3(1., .2, .2),
  vec3(.2, 1., .2),
  vec3(.2, .2, 1.),
  vec3(1., 1., .2),
  vec3(.2, 1., 1.),
  vec3(1., .2, 1.),
  vec3(1., 1., 1.)
);

void main() {
  highp ivec2 gridWH = ivec2(uLevel.zw / uTileWH);
  highp ivec2 cell = ivec2(int(vPx.x / uTileWH.x), int(vPx.y / uTileWH.y));
  if (cell.x < 0 || cell.x >= gridWH.x ||
      cell.y < 0 || cell.y >= gridWH.y) discard;

  highp uint tile = texelFetch(uTiles, cell, 0).r;
  if (tile == 0u) discard;

  fragColor = vec4(palette[tile % 8u], 1.);
}
`
