export const spriteFrag: string = `#version 300 es

uniform highp sampler2D uSpritesheet;
uniform highp usampler2D uAtlasCels;
uniform highp vec2 uAtlasSize;
uniform mediump int uBlendMode;

in highp vec2 vTexUV; // local pixel position within destination box.
flat in highp vec2 vDstWH;
flat in highp vec4 vCelXYWH; // in atlas pixels.
flat in highp uint vFlags;

out highp vec4 fragColor;

const mediump int layerBlendModeMultiply = 1;
const highp uint spriteHiddenMask = 1u;
const highp uint spriteHiddenShift = 0u;
const highp uint spriteFlipXMask = 1u;
const highp uint spriteFlipXShift = 1u;
const highp uint spriteFlipYMask = 1u;
const highp uint spriteFlipYShift = 2u;
const highp uint spriteStretchMask = 1u;
const highp uint spriteStretchShift = 3u;
const highp uint spritePalAnimMask = 0xffu;
const highp uint spritePalAnimShift = 4u;

highp vec4 palColor(highp uvec4 cel, mediump int slot) {
  return texelFetch(
    uSpritesheet,
    ivec2(int(cel.x) + slot, int(cel.y)),
    0
  );
}

void main() {
  bool hidden = (vFlags >> spriteHiddenShift & spriteHiddenMask) != 0u;
  if (hidden) discard;
  highp vec2 samplePos = (vFlags >> spriteStretchShift & spriteStretchMask) != 0u
    ? vTexUV * vCelXYWH.zw / vDstWH
    : mod(floor(vTexUV) + 0.5, vCelXYWH.zw);
  bool flipX = (vFlags >> spriteFlipXShift & spriteFlipXMask) != 0u;
  if (flipX) samplePos.x = vCelXYWH.z - samplePos.x;
  bool flipY = (vFlags >> spriteFlipYShift & spriteFlipYMask) != 0u;
  if (flipY) samplePos.y = vCelXYWH.w - samplePos.y;
  highp vec4 tex = texture(uSpritesheet, (vCelXYWH.xy + samplePos) / uAtlasSize);
  if (tex.a == 0.) discard;
  highp uint palID = (vFlags >> spritePalAnimShift) & spritePalAnimMask;
  if (palID != 0u) {
    highp uvec4 palCel = texelFetch(uAtlasCels, ivec2(0, int(palID)), 0);
    mediump uint palSlot = uint(round(tex.r * 255.));
    if (palSlot < palCel.z) {
      tex = palColor(palCel, int(palSlot));
    }
  }
  if (uBlendMode == layerBlendModeMultiply) {
    // multiply blend; pre-mix src toward white by alpha so DST_COLOR*ZERO gives
    // dst * lerp(1, tex.rgb, tex.a); transparent pixels don't darken.
    fragColor = vec4(mix(vec3(1.), tex.rgb, tex.a), 1.);
    return;
  }
  fragColor = tex;
}
`
