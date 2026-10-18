#version 300 es
precision highp float;

uniform mediump sampler2D uFrame; // RGBA8 color.
uniform highp ivec2 uResolution;

out mediump vec4 fragColor;

void main() {
  fragColor = texture(uFrame, gl_FragCoord.xy / vec2(uResolution));
}
