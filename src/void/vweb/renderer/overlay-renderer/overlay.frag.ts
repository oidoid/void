export const overlayFrag: string = `#version 300 es

uniform highp ivec2 uResolution;
uniform highp vec2 uLayerOffsetPhy;
uniform highp float uCellSize; // cell size in physical pixels including border.

out highp vec4 fragColor;

void main() {
  if (uCellSize < 200.) { fragColor = vec4(1.); return; }

  highp vec2 pos = vec2(gl_FragCoord.x, float(uResolution.y) - gl_FragCoord.y);

  // cell-local coords [0, 1) within each layer-scale pixel.
  highp vec2 cell = mod(pos - uLayerOffsetPhy, uCellSize) / uCellSize;

  highp float grid = float(cell.x * uCellSize < 1. || cell.y * uCellSize < 1.);

  highp vec2 overshoot = max(abs(cell - 0.5) * 2. - 0.52, 0.);
  highp float roundMask = 1. - smoothstep(0.25, 1., length(overshoot) * 3.) * 0.15;

  fragColor = vec4(vec3(roundMask * mix(1., 0.99, grid)), 1.);
}
`
