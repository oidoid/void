export const tileFragGLSL: string = `#version 300 es
precision highp int;
precision highp float;
precision highp usampler2D;

uniform ivec4 uCam;
uniform ivec2 uTileWH;
uniform ivec2 uLevelWH;
uniform ivec2 uLevelXY;
uniform ivec2 uTilesetWH;
uniform usampler2D uTileset;
uniform sampler2D uTileTex;

in vec2 vCam;

out vec4 oRGBA;

void main() {
  ivec2 px = ivec2(floor(vec2(uCam.xy) + vCam));
  ivec2 local = px - uLevelXY;
  if (local.x < 0 || local.y < 0 || local.x >= uLevelWH.x || local.y >= uLevelWH.y)
    discard;

  ivec2 tile = local / uTileWH;
  uint id = texelFetch(uTileset, tile, 0).r;
  if (id == 0u) discard;
  int tileIndex = int(id - 1u);

  int tilesPerRow = uTilesetWH.x / uTileWH.x;
  if (tilesPerRow <= 0) discard;

  int tileX = tileIndex % tilesPerRow;
  int tileY = tileIndex / tilesPerRow;

  ivec2 atlasTiles = uTilesetWH / uTileWH;
  if (tileIndex < 0 || tileX >= atlasTiles.x || tileY >= atlasTiles.y)
    discard;

  ivec2 tileLocal = local - tile * uTileWH;
  ivec2 tilesetXY = ivec2(tileX * uTileWH.x + tileLocal.x, tileY * uTileWH.y + tileLocal.y);

  vec2 uv = (vec2(tilesetXY) + .5) / vec2(uTilesetWH);
  oRGBA = texture(uTileTex, uv);
  if (oRGBA.a < .001) discard;
}
`
