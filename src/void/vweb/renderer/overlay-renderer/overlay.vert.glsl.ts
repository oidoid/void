export const overlayVert: string = `#version 300 es

// hardcoded fullscreen triangle; scissor clips to overlay region.
const highp vec2 pos[3] = vec2[3](
  vec2(-1., -1.),
  vec2( 3., -1.),
  vec2(-1.,  3.)
);

void main() {
  gl_Position = vec4(pos[gl_VertexID], 0., 1.);
}
`
