#version 300 es

uniform highp ivec2 uResolution;
uniform highp vec4 uDstXYWH;

out highp vec2 vUV;

// [0, 1]² unit quad.
const highp vec2 corners[6] = vec2[6](
  vec2(0., 0.),
  vec2(1., 0.),
  vec2(0., 1.),
  vec2(1., 0.),
  vec2(1., 1.),
  vec2(0., 1.)
);

void main() {
  highp vec2 corner = corners[gl_VertexID];
  highp vec2 px = uDstXYWH.xy + corner * uDstXYWH.zw;
  highp vec2 ndc = px / vec2(uResolution) * 2. - 1.;
  ndc.y = -ndc.y;
  gl_Position = vec4(ndc, 0., 1.);
  vUV = vec2(corner.x, 1. - corner.y);
}
