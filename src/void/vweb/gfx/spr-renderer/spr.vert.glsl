#version 300 es

uniform highp ivec2 uResolution;
uniform highp vec2 uCamXY;
uniform bool uPixel;
// highp keeps 32b offsets reconstructed from RGBA16UI channels.
uniform highp usampler2D uAtlas;

const highp uint sprHiddenMask = 1u;
const highp uint sprHiddenShift = 0u;
const mediump uint sprTagMask = 0xfffu;
const mediump uint sprTagShift = 0u;
const highp uint sprZTopMask = 1u;
const highp uint sprZTopShift = 12u;
const highp uint sprRotMask = 0xfffu;
const highp uint sprRotShift = 13u;
const highp float tau = 6.283185307179586;
const highp uint sprWHSource = 0u;
const highp uint sprSublayerMask = 0xfu;
const highp float sprDepthYRanks = 4096.;
const highp float sprDepthRange = 65536.;

layout(location = 0) in highp vec2 aXY; // spr origin.
layout(location = 1) in mediump uint aTag; // 12b atlas ID.
layout(location = 2) in lowp uint aCel; // uint8.
layout(location = 5) in lowp uint aZ; // uint8.
layout(location = 3) in highp uvec2 aWH; // destination size; zero uses source cel size.
layout(location = 4) in highp uint aFlags;

// highp keeps subpixel coordinates at large atlas sizes and 16b depth ranks.
out highp vec2 vTexUV; // local pixel position within destination box.
flat out highp vec2 vDstWH;
flat out highp vec4 vCelXYWH; // in atlas pixels.
flat out highp uint vFlags;

// [0, 1]² unit quad.
const highp vec2 corners[6] = vec2[6](
  vec2(0., 0.),
  vec2(1., 0.),
  vec2(0., 1.),
  vec2(1., 0.),
  vec2(1., 1.),
  vec2(0., 1.)
);

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
  bool hidden = (aFlags >> sprHiddenShift & sprHiddenMask) != 0u;
  mediump uint tag = aTag >> sprTagShift & sprTagMask;
  if (tag == 0u || hidden) {
    gl_Position = vec4(2., 0., 0., 1.);
    return;
  }

  highp uvec4 cel = atlasCel(tag, aCel);
  highp vec2 celMin = vec2(float(cel.x), float(cel.y));
  highp vec2 celWH = vec2(float(cel.z), float(cel.w));
  highp vec2 wh = aWH.x != sprWHSource ? vec2(float(aWH.x), float(aWH.y)) : celWH;
  bool zTop = (aFlags >> sprZTopShift & sprZTopMask) != 0u;

  highp vec2 corner = corners[gl_VertexID];
  highp vec2 originPx = uPixel ? floor(aXY + .5) : aXY;
  highp vec2 originScreenPx = originPx - uCamXY;
  highp vec2 centerPx = wh * .5;
  highp vec2 localPx = corner * wh - centerPx;
  highp float rot = float(
    aFlags >> sprRotShift & sprRotMask
  ) * tau / 4096.;
  highp float sinRot = sin(rot);
  highp float cosRot = cos(rot);
  highp vec2 px = originScreenPx + centerPx + vec2(
    cosRot * localPx.x + sinRot * localPx.y,
    -sinRot * localPx.x + cosRot * localPx.y
  );
  highp vec2 ndc = px / vec2(uResolution) * 2. - 1.;
  // layer draw order is handled by clearing depth between layer draws. within
  // this layer, pack the 4-bit sublayer and a 12-bit screen-Y anchor rank.
  highp float originScreenY = originPx.y - uCamXY.y;
  highp float anchorScreenY = originScreenY + (zTop ? 0. : wh.y);
  highp float anchorRank = clamp(
    floor(anchorScreenY * sprDepthYRanks / max(float(uResolution.y), 1.)),
    0.,
    sprDepthYRanks - 1.
  );
  highp float depthCode =
    float(aZ & sprSublayerMask) * sprDepthYRanks + anchorRank;
  highp float z = 1. - 2. * (depthCode + .5) / sprDepthRange;
  ndc.y = -ndc.y;
  gl_Position = vec4(ndc, z, 1.);

  vTexUV = corner * wh;
  vDstWH = wh;
  vCelXYWH = vec4(celMin, celWH);
  vFlags = aFlags;
}
