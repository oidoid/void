export const spriteVert: string = `#version 300 es

uniform highp ivec2 uResolution;
uniform highp vec2 uCamXY;
uniform highp usampler2D uAtlasCels;
uniform highp vec2 uAtlasSize;

layout(location=0) in highp vec2 aXY; // sprite center.
layout(location=1) in highp uint aAnimID;
layout(location=2) in highp uint aCel;
layout(location=3) in highp uint aZ;

out highp vec2 vTexUV;

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
  highp uvec4 cel = texelFetch(uAtlasCels, ivec2(int(aCel), int(aAnimID)), 0);
  highp vec2 celMin = vec2(float(cel.x), float(cel.y));
  highp vec2 wh = vec2(float(cel.z), float(cel.w));

  highp vec2 corner = corners[gl_VertexID];
  highp vec2 px = floor(aXY + (corner - 0.5) * wh) - floor(uCamXY);
  highp vec2 ndc = px / vec2(uResolution) * 2. - 1.;
  highp float z = 1. - float(aZ) / 4294967295. * 2.;
  ndc.y = -ndc.y;
  gl_Position = vec4(ndc, z, 1.);

  vTexUV = (celMin + 0.5 + (wh - 1.0) * corner) / uAtlasSize;
}
`
