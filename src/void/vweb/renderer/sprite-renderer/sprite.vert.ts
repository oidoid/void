export const spriteVert: string = `#version 300 es

uniform highp ivec2 uResolution;
uniform highp vec2 uCamXY;
uniform highp float uLayerScale;
uniform highp vec2 uLayerOffsetPhy;
uniform highp float uLayerModulo;
uniform mediump int uRenderMode;
uniform highp usampler2D uAtlasCels;
uniform highp vec2 uAtlasSize;

const mediump int layerRenderModeInt = 0;
const highp uint animCelMask = 0xfu;
const highp uint animCelShift = 4u;
const highp uint spriteHiddenMask = 1u;
const highp uint spriteHiddenShift = 0u;
const highp uint spriteWHSource = 0u;
const highp float zRange = 128.;


layout(location=0) in highp vec2 aXY; // sprite origin.
layout(location=1) in highp uint aAnimCel; // hi 12 bits = AnimID, lo 4 bits = Cel.
layout(location=2) in highp uint aZ;
layout(location=3) in highp uvec2 aWH; // destination size; zero uses source cel size.
layout(location=4) in highp uint aFlags; // bit 0 = Hidden, bit 1 = FlipX, bit 2 = FlipY, bit 3 = Stretch.

out highp vec2 vTexUV; // local pixel position within destination box.
flat out highp vec2 vDstWH;
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
  highp uint animID = aAnimCel >> animCelShift;
  bool hidden = (aFlags >> spriteHiddenShift & spriteHiddenMask) != 0u;
  if (animID == 0u || hidden) { gl_Position = vec4(2., 0., 0., 1.); return; }

  highp uint celI = aAnimCel & animCelMask;
  highp uvec4 cel = texelFetch(uAtlasCels, ivec2(int(celI), int(animID)), 0);
  highp vec2 celMin = vec2(float(cel.x), float(cel.y));
  highp vec2 celWH = vec2(float(cel.z), float(cel.w));
  highp vec2 wh = aWH.x != spriteWHSource ? vec2(float(aWH.x), float(aWH.y)) : celWH;

  highp vec2 corner = corners[gl_VertexID];
  highp vec2 originPx = aXY * uLayerScale;
  highp vec2 sizePx = corner * wh * uLayerScale;
  highp vec2 camPx = floor(uCamXY / uLayerModulo) * uLayerModulo;
  highp vec2 px = uRenderMode == layerRenderModeInt
    ? floor(originPx / uLayerModulo) * uLayerModulo + sizePx + uLayerOffsetPhy - camPx
    : originPx + sizePx + uLayerOffsetPhy - uCamXY;
  highp vec2 ndc = px / vec2(uResolution) * 2. - 1.;
  highp float z = (zRange - float(aZ)) / zRange;
  ndc.y = -ndc.y;
  gl_Position = vec4(ndc, z, 1.);

  vTexUV = corner * wh;
  vDstWH = wh;
  vCelXYWH = vec4(celMin, celWH);
  vFlags = aFlags;
}
`
