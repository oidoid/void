import { I32, Immutable } from '@/oidlib';

// Logical things.
export type InputButton = Parameters<typeof InputButton.values['has']>[0];

export type InputDirection = Parameters<typeof InputDirection.values['has']>[0];

export namespace InputDirection {
  export const values = Immutable(
    new Set(
      [
        'Point',
        'LeftPrimary',
        'RightPrimary',
        'UpPrimary',
        'DownPrimary',
      ] as const,
    ),
  );

  // No relationship to PointerButton.toBit.
  export const toBit = Immutable(
    // deno-fmt-ignore
    {
        None:         I32(0b0_0000),
        Point:        I32(0b0_0001),
        LeftPrimary:  I32(0b0_0010),
        RightPrimary: I32(0b0_0100),
        UpPrimary:    I32(0b0_1000),
        DownPrimary:  I32(0b1_0000),
      } as const,
  ) satisfies Record<InputDirection, I32>;

  export const toInvertBit = Immutable({
    LeftPrimary: toBit.RightPrimary,
    RightPrimary: toBit.LeftPrimary,
    UpPrimary: toBit.DownPrimary,
    DownPrimary: toBit.UpPrimary,
  }) satisfies Partial<Record<InputDirection, I32>>;
}

export namespace InputButton {
  export const values = Immutable(
    new Set(
      [
        'ActionPrimary',
        'Menu',
        'DebugContextLoss',
        'ScaleReset',
        'ScaleIncrease',
        'ScaleDecrease',
      ] as const,
    ),
  );

  // No relationship to PointerButton.toBit.
  export const toBit = Immutable(
    // deno-fmt-ignore
    {
      None:             I32(0b0000_0000_0000),
      ActionPrimary:    I32(0b0000_0100_0000),
      Menu:             I32(0b0000_1000_0000),
      DebugContextLoss: I32(0b0001_0000_0000),
      ScaleReset:       I32(0b0010_0000_0000),
      ScaleIncrease:    I32(0b0100_0000_0000),
      ScaleDecrease:    I32(0b1000_0000_0000),
    } as const,
  ) satisfies Record<InputButton, I32>;
}
