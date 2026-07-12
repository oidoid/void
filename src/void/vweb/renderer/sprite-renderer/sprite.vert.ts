export const spriteVert: string = `#version 300 es

uniform highp ivec2 uResolution;
uniform highp vec2 uCamXY;
uniform highp float uLayerScale;
uniform highp vec2 uLayerOffsetPhy;
uniform highp float uLayerModulo;
uniform highp int uRenderMode;
uniform highp usampler2D uAtlasCels;
uniform highp vec2 uAtlasSize;


layout(location=0) in highp vec2 aXY; // sprite origin.
layout(location=1) in highp uint aAnimCel; // hi 12 bits = AnimID, lo 4 bits = Cel.
layout(location=2) in highp uint aZ;
layout(location=3) in highp uvec2 aWH; // when nonzero, stretch sprite to this size.
layout(location=4) in highp uint aFlags; // bit 0 = Hidden, bit 1 = FlipX, bit 2 = FlipY.

out highp vec2 vTexUV; // local pixel position within destination box.
flat out highp vec4 vCelXYWH; // in atlas pixels.
flat out highp uint vFlags;

// (0,0) to (1,1) unit quad.
const highp vec2 corners[6] = vec2[6](
  vec2(0., 0.),
  vec2(1., 0.),
  vec2(0., 1.),
  vec2(1., 0.),
  vec2(1., 1.),
  vec2(0., 1.)
);

void main() {
  highp uint animID = aAnimCel >> 4u;
  bool hidden = (aFlags & 0x1u) == 0x1u;
  if (animID == 0u || hidden) { gl_Position = vec4(2., 0., 0., 1.); return; }

  highp uint celI = aAnimCel & 0xfu;
  highp uvec4 cel = texelFetch(uAtlasCels, ivec2(int(celI), int(animID)), 0);
  highp vec2 celMin = vec2(float(cel.x), float(cel.y));
  highp vec2 celWH = vec2(float(cel.z), float(cel.w));
  highp vec2 wh = aWH.x != 0u ? vec2(float(aWH.x), float(aWH.y)) : celWH;

  highp vec2 corner = corners[gl_VertexID];
  highp vec2 originPx = aXY * uLayerScale;
  highp vec2 sizePx = corner * wh * uLayerScale;
  highp vec2 camPx = floor(uCamXY / uLayerModulo) * uLayerModulo;
  highp vec2 px = uRenderMode == 0
    ? floor(originPx / uLayerModulo) * uLayerModulo + sizePx + uLayerOffsetPhy - camPx
    : originPx + sizePx + uLayerOffsetPhy - uCamXY;
  highp vec2 ndc = px / vec2(uResolution) * 2. - 1.;
  highp float z = (128. - float(aZ)) / 128.;
  ndc.y = -ndc.y;
  gl_Position = vec4(ndc, z, 1.);

  vTexUV = corner * wh;
  vCelXYWH = vec4(celMin, celWH);
  vFlags = aFlags;
}
`
