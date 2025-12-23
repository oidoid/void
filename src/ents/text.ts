import {memProp5x6} from 'mem-font'
import type {AnyTag} from '../graphics/atlas.ts'
import {fontCharToTag} from '../text/font.ts'
import {layoutText} from '../text/text-layout.ts'
import type {Void} from '../void.ts'
import type {QueryEnt} from './ent-query.ts'
import type {Sys} from './sys.ts'

export type TextEnt = QueryEnt<AnyTag, 'text'>
export type TextWHEnt<Tag extends AnyTag> = QueryEnt<
  Tag,
  TextWHSys<Tag>['query']
>
export type TextXYEnt<Tag extends AnyTag> = QueryEnt<
  Tag,
  TextXYSys<Tag>['query']
>

/** reads sprite text; writes sprite WH and invalid. */
export class TextWHSys<Tag extends AnyTag> implements Sys<Tag> {
  readonly query = 'sprite & text & textWH' as const

  update(ent: TextWHEnt<Tag>): void {
    if (!ent.invalid) return
    textSetWH(ent)
  }
}

/** reads sprite XYZ, text, text WH; writes invalid. */
export class TextXYSys<Tag extends AnyTag> implements Sys<Tag> {
  readonly query = 'sprite & text & textWH & textXY' as const

  free(ent: TextXYEnt<Tag>): void {
    for (const sprite of ent.textXY.chars) sprite.free()
    ent.textXY.chars.length = 0
    ent.invalid = true
  }

  update(ent: TextXYEnt<Tag>, v: Void<Tag, string>): void {
    if (!ent.invalid) return
    textSetXY(ent, v)
  }
}

export function textSetWH<Tag extends AnyTag>(ent: TextWHEnt<Tag>): void {
  const layout = layoutText({
    font: memProp5x6,
    maxW: ent.textWH.maxW,
    scale: ent.textWH.scale,
    start: {x: 0, y: 0}, // start at 0, 0 to avoid relayout in textSetXY().
    text: ent.text
  })
  ent.textWH.layout = layout
  let w = layout.w + ent.textWH.pad.w + ent.textWH.pad.e
  let h =
    (ent.textWH.trim === 'Leading'
      ? layout.h - memProp5x6.leading * ent.textWH.scale
      : ent.textWH.trim === 'Descender'
        ? layout.trimmedH
        : layout.h) +
    ent.textWH.pad.n +
    ent.textWH.pad.s
  if (ent.ninePatch) {
    w +=
      ent.ninePatch.border.w +
      ent.ninePatch.border.e +
      ent.ninePatch.pad.w +
      ent.ninePatch.pad.e
    h +=
      ent.ninePatch.border.n +
      ent.ninePatch.border.s +
      ent.ninePatch.pad.n +
      ent.ninePatch.pad.s
  }
  ent.sprite.w = w
  ent.sprite.h = h
  ent.invalid = true
}

// to-do: don't relayout if textXY.xy === sprite.xy
// can cause a double layout due to ent.invalid. this seems worth caching with the render state so that it can keep track of its own state vs all of the ent.
export function textSetXY<Tag extends AnyTag>(
  ent: TextXYEnt<Tag>,
  v: Void<Tag, string>
): void {
  let len = 0
  const layout = ent.textWH.layout
  for (const [i, char] of layout.chars.entries()) {
    if (char == null) continue
    const sprite = (ent.textXY.chars[len] ??= v.alloc())
    sprite.x =
      ent.sprite.x +
      char.x +
      ent.textWH.pad.w +
      (ent.ninePatch ? ent.ninePatch.border.w + ent.ninePatch.pad.w : 0)
    sprite.y =
      ent.sprite.y +
      char.y +
      ent.textWH.pad.n +
      (ent.ninePatch ? ent.ninePatch.border.n + ent.ninePatch.pad.n : 0)
    sprite.z = ent.textXY.z
    sprite.tag = fontCharToTag(memProp5x6, ent.text[i]!) as Tag
    sprite.stretch = true
    sprite.w *= ent.textWH.scale
    sprite.h *= ent.textWH.scale
    sprite.visible = true
    len++
  }
  while (ent.textXY.chars.length > len) ent.textXY.chars.pop()!.free()
  ent.invalid = true
}

// to-do: why doesn't sprite use a helper like this?
export function textSetText(ent: TextEnt, str: string): void {
  if (str === ent.text) return
  ent.text = str
  ent.invalid = true
}

// to-do: can't decide on global names like SetMaxW or Sys. single char??
// export function labelSetMaxW(ent: TextUIEnt, w: number): void {
//   if (w === ent.textUI.maxW) return
//   ent.textUI.maxW = w
//   ent.invalid = true
// }

// export function labelSetScale(ent: TextUIEnt, scale: number): void {
//   if (scale === ent.textUI.scale) return
//   ent.textUI.scale = scale
//   ent.invalid = true
// }

// export function labelGetCenterWithin(
//   ent: Readonly<TextUIEnt>,
//   box: Readonly<Box>
// ): XY {
//   return {
//     x: box.x + box.w / 2 - ent.sprite.w / 2,
//     y: box.y + box.h / 2 - ent.sprite.h / 2
//   }
// }
