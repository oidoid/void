import { FontMeta } from '@/mem'
import { Font } from '@/void'

export function parseFont(meta: FontMeta): Font {
  return {
    id: meta.id,
    name: meta.name,
    cellWidth: meta.cellWidth,
    cellHeight: meta.cellHeight,
    leading: meta.leading,
    lineHeight: meta.cellHeight + meta.leading,
    baseline: meta.baseline,
    kerning: meta.kerning,
    defaultKerning: meta.defaultKerning,
    whitespaceKerning: meta.whitespaceKerning,
    endOfLineKerning: meta.endOfLineKerning,
    charWidth: meta.charWidth,
    defaultCharWidth: meta.defaultCharWidth,
  }
}
