export const sprFrag: string = `#version 300 es
precision highp float;

uniform highp sampler2D uSprsheet;
uniform highp usampler2D uAtlasCels;
uniform highp vec2 uAtlasSize;
uniform mediump int uBlendMode;

in highp vec2 vTexUV; // local pixel position within destination box.
flat in highp vec2 vDstWH;
flat in highp vec4 vCelXYWH; // in atlas pixels.
flat in highp uint vFlags;

out highp vec4 fragColor;

const mediump int layerBlendModeMultiply = 1;
const highp uint sprHiddenMask = 1u;
const highp uint sprHiddenShift = 0u;
const highp uint sprFlipXMask = 1u;
const highp uint sprFlipXShift = 1u;
const highp uint sprFlipYMask = 1u;
const highp uint sprFlipYShift = 2u;
const highp uint sprStretchMask = 1u;
const highp uint sprStretchShift = 3u;
const highp uint sprPalTagMask = 0xffu;
const highp uint sprPalTagShift = 4u;

highp vec4 palColor(highp uvec4 cel, mediump int slot) {
  return texelFetch(
    uSprsheet,
    ivec2(int(cel.x) + slot, int(cel.y)),
    0
  );
}

void main() {
  bool hidden = (vFlags >> sprHiddenShift & sprHiddenMask) != 0u;
  if (hidden) discard;
  highp vec2 samplePos = (vFlags >> sprStretchShift & sprStretchMask) != 0u
    ? vTexUV * vCelXYWH.zw / vDstWH
    : mod(floor(vTexUV) + 0.5, vCelXYWH.zw);
  bool flipX = (vFlags >> sprFlipXShift & sprFlipXMask) != 0u;
  if (flipX) samplePos.x = vCelXYWH.z - samplePos.x;
  bool flipY = (vFlags >> sprFlipYShift & sprFlipYMask) != 0u;
  if (flipY) samplePos.y = vCelXYWH.w - samplePos.y;
  highp vec4 tex = texture(uSprsheet, (vCelXYWH.xy + samplePos) / uAtlasSize);
  if (tex.a == 0.) discard;
  highp uint palTag = (vFlags >> sprPalTagShift) & sprPalTagMask;
  if (palTag != 0u) {
    highp uvec4 palCel = texelFetch(uAtlasCels, ivec2(0, int(palTag)), 0);
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
