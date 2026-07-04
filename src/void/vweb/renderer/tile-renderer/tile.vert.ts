export const tileVert: string = `#version 300 es

uniform highp ivec2 uResolution;
uniform highp vec2 uCamXY;
uniform highp float uLayerScale;
uniform highp int uRenderMode;
uniform highp vec4 uLevel; // xywh.

out highp vec2 vPx;

// [0, 1]² unit quad.
const highp vec2 quad[6] = vec2[6](
  vec2(0., 0.),
  vec2(1., 0.),
  vec2(0., 1.),
  vec2(1., 0.),
  vec2(1., 1.),
  vec2(0., 1.)
);

void main() {
  highp vec2 uv = quad[gl_VertexID];
  vPx = uv * uLevel.zw;
  highp vec2 scaledPx = (uLevel.xy + vPx) * uLayerScale;
  highp vec2 px = uRenderMode == 0
    ? floor(scaledPx) - floor(uCamXY)
    : scaledPx - uCamXY;
  highp vec2 ndc = px / vec2(uResolution) * 2. - 1.;
  ndc.y = -ndc.y;
  gl_Position = vec4(ndc, 1., 1.);
}
`
