import { FontMeta } from '@/mem';
import { I16, Str } from '@/oidlib';

export interface Font<T extends number = I16> extends FontMeta<T> {
  /** `cellHeight + leading`. */
  readonly lineHeight: T;
}

export namespace Font {
  /** @arg rhs Undefined means end of line. */
  export function kerning(
    self: Font,
    lhs: string,
    rhs: string | undefined,
  ): I16 {
    if (rhs == null) return self.endOfLineKerning;
    if (Str.isBlank(lhs) || Str.isBlank(rhs)) return self.whitespaceKerning;
    return self.kerning[lhs + rhs] ?? self.defaultKerning;
  }

  export function charWidth(self: Font, letter: string): I16 {
    return self.charWidth[letter] ?? self.defaultCharWidth;
  }
}
