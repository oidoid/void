import { Immutable } from '@/ooz'
import { Font } from '@/void'
import { FontMeta } from '@/mem'
import { mapValues } from 'std/collections/map_values.ts'

export namespace FontParser {
  export function parse<T extends number>(
    meta: FontMeta,
    cast: (val: number) => T,
  ): Font<T> {
    return Immutable({
      id: meta.id,
      name: meta.name,
      cellWidth: cast(meta.cellWidth),
      cellHeight: cast(meta.cellHeight),
      leading: cast(meta.leading),
      lineHeight: cast(meta.cellHeight + meta.leading),
      baseline: cast(meta.baseline),
      kerning: mapValues(meta.kerning, cast),
      defaultKerning: cast(meta.defaultKerning),
      whitespaceKerning: cast(meta.whitespaceKerning),
      endOfLineKerning: cast(meta.endOfLineKerning),
      charWidth: mapValues(meta.charWidth, cast),
      defaultCharWidth: cast(meta.defaultCharWidth),
    })
  }
}
