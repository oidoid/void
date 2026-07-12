export const spriteFrag: string = `#version 300 es

uniform highp sampler2D uSpritesheet;
uniform highp vec2 uAtlasSize;
uniform highp int uBlendMode;

in highp vec2 vTexUV; // local pixel position within destination box.
flat in highp vec4 vCelXYWH; // in atlas pixels.
flat in highp uint vFlags;

out highp vec4 fragColor;

void main() {
  bool hidden = (vFlags & 1u) != 0u;
  if (hidden) discard;
  highp vec2 localPx = floor(vTexUV) + 0.5;
  highp vec2 samplePos = mod(localPx, vCelXYWH.zw);
  bool flipX = (vFlags & 2u) != 0u;
  if (flipX) samplePos.x = vCelXYWH.z - samplePos.x;
  bool flipY = (vFlags & 4u) != 0u;
  if (flipY) samplePos.y = vCelXYWH.w - samplePos.y;
  highp vec4 tex = texture(uSpritesheet, (vCelXYWH.xy + samplePos) / uAtlasSize);
  if (tex.a == 0.) discard;
  if (uBlendMode == 1) {
    // multiply blend; pre-mix src toward white by alpha so DST_COLOR*ZERO gives
    // dst * lerp(1, tex.rgb, tex.a); transparent pixels don't darken.
    fragColor = vec4(mix(vec3(1.), tex.rgb, tex.a), 1.);
    return;
  }
  fragColor = tex;
}
`
