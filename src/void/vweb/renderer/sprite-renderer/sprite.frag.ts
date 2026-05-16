export const spriteFrag: string = `#version 300 es

uniform highp sampler2D uSpritesheet;

in highp vec2 vTexUV;

out highp vec4 fragColor;

void main() {
  fragColor = texture(uSpritesheet, vTexUV);
}
`
