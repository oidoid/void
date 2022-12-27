import { I32, Immutable } from '@/oidlib';

/**
 * Directions are handled distinctly from other buttons as holding a button like
 * action while changing directions is usually thought of as a triggered event
 * for the directional state but not the button state.
 */
export type Direction = Parameters<typeof Direction.values['has']>[0];

export namespace Direction {
  export const values = Immutable(
    new Set(
      ['LeftPrimary', 'RightPrimary', 'UpPrimary', 'DownPrimary'] as const,
    ),
  );

  export function is(direction: string): direction is Direction {
    return values.has(direction as Direction);
  }

  // No relationship to PointerButton.toBit.
  export const toBit = Immutable(
    // deno-fmt-ignore
    {
      None:         I32(0b0000),
      LeftPrimary:  I32(0b0001),
      RightPrimary: I32(0b0010),
      UpPrimary:    I32(0b0100),
      DownPrimary:  I32(0b1000),
    } as const,
  ) satisfies Record<Direction, I32>;

  export const toInvertBit = Immutable(
    {
      LeftPrimary: toBit.RightPrimary,
      RightPrimary: toBit.LeftPrimary,
      UpPrimary: toBit.DownPrimary,
      DownPrimary: toBit.UpPrimary,
    } as const,
  ) satisfies Record<Direction, I32>;
}
