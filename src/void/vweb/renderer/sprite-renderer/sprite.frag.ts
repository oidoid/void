export const spriteFrag: string = `#version 300 es

uniform highp sampler2D uSpritesheet;
uniform highp vec2 uAtlasSize;
uniform highp int uBlendMode;

in highp vec2 vTexUV; // local pixel position within destination box.
flat in highp vec4 vCelXYWH; // in atlas pixels.

out highp vec4 fragColor;

void main() {
  highp vec2 localPx = floor(vTexUV) + 0.5;
  highp vec4 tex = texture(uSpritesheet, (vCelXYWH.xy + mod(localPx, vCelXYWH.zw)) / uAtlasSize);
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
