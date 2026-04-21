export const spriteVert: string = `#version 300 es

uniform highp ivec2 uResolution;
uniform highp vec2 uCamXY;

layout(location=0) in highp vec2 aXY;
layout(location=1) in highp float aRadius;
layout(location=2) in highp vec4 aColor;

out highp vec2 vUV;
out highp vec4 vColor;

// [-1, 1]² unit quad.
const highp vec2 quad[6] = vec2[6](
  vec2(-1., -1.),
  vec2( 1., -1.),
  vec2(-1.,  1.),
  vec2( 1., -1.),
  vec2( 1.,  1.),
  vec2(-1.,  1.)
);

void main() {
  highp vec2 uv = quad[gl_VertexID];
  highp vec2 px = aXY + uv * aRadius - floor(uCamXY);
  highp vec2 ndc = px / vec2(uResolution) * 2. - 1.;
  ndc.y = -ndc.y;
  gl_Position = vec4(ndc, 0., 1.);

  vUV = uv;
  vColor = aColor;
}
`
