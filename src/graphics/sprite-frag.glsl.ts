export const spriteFragGLSL: string = `#version 300 es
#pragma debug(${debug?.render ? 'on' : 'off'})
#pragma optimize(${debug?.render ? 'off' : 'on'})

precision highp int;
precision highp float;
precision highp usampler2D;

uniform sampler2D uTex;
uniform uvec2 uTexWH;

flat in float vAngle;
flat in vec2 vAABBWH;
flat in vec2 vSpriteWH;
flat in uint vStretch;
flat in ivec4 vTexXYWH;
flat in uint vVisible;
in vec2 vDstWH;
flat in ivec2 vDstWHFixed;

out vec4 oRGBA;

void main() {
  if (vVisible == 0u || vDstWHFixed.x == 0 || vDstWHFixed.y == 0)
    discard;

  // map from AABB-local coordinate -> sprite-local coordinate by unrotating
  // around the rect center. this avoids clipping from the unrotated quad.
  vec2 aabbCenter = vAABBWH * .5;
  vec2 spriteCenter = vSpriteWH * .5;
  float cosA = cos(vAngle);
  float sinA = sin(vAngle);
  vec2 aabbLocal = vec2(
    float(sign(vDstWHFixed.x)) * vDstWH.x,
    float(sign(vDstWHFixed.y)) * vDstWH.y
  );
  // p is centered AABB coordinate. apply inverse rotation (-angle).
  vec2 p = aabbLocal - aabbCenter;
  vec2 q = vec2(cosA * p.x + sinA * p.y, -sinA * p.x + cosA * p.y);
  vec2 spriteLocal = q + spriteCenter;

  // vDstWHFixed uses sign to encode flips.
  if (vDstWHFixed.x < 0) spriteLocal.x = (vSpriteWH.x - 1.0) - spriteLocal.x;
  if (vDstWHFixed.y < 0) spriteLocal.y = (vSpriteWH.y - 1.0) - spriteLocal.y;

  // discard pixels falling outside rotated rectangle.
  if (spriteLocal.x < 0. || spriteLocal.y < 0. ||
      spriteLocal.x >= vSpriteWH.x || spriteLocal.y >= vSpriteWH.y)
    discard;

  // sample from spritesheet.
  vec2 srcWH = vec2(vTexXYWH.zw);
  vec2 uv = vStretch == 1u
    ? (spriteLocal * srcWH / vSpriteWH)
    : mod(spriteLocal, srcWH);
  vec2 px = vec2(vTexXYWH.xy) + uv;

  oRGBA = texture(uTex, px / vec2(uTexWH));
  if(oRGBA.a < .001) discard;
}
`

import {debug} from '../utils/debug.ts'
