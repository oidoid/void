export const overlayFrag: string = `#version 300 es
precision highp float;

uniform highp sampler2D uFrame;
uniform highp ivec2 uResolution;

out highp vec4 fragColor;

void main() {
  fragColor = texture(uFrame, gl_FragCoord.xy / vec2(uResolution));
}
`
