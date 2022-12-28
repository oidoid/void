import { Immutable } from '@/oidlib';

export type Button = Parameters<typeof Button.values['has']>[0];

export namespace Button {
  export const values = Immutable(
    new Set(
      [
        'Point',
        'LeftPrimary',
        'RightPrimary',
        'UpPrimary',
        'DownPrimary',
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
  export const Bit = Immutable(
    // deno-fmt-ignore
    {
      LeftPrimary:      0b000_0000_0001n,
      RightPrimary:     0b000_0000_0010n,
      UpPrimary:        0b000_0000_0100n,
      DownPrimary:      0b000_0000_1000n,
      Point:            0b000_0001_0000n,
      ActionPrimary:    0b000_0010_0000n,
      Menu:             0b000_0100_0000n,
      DebugContextLoss: 0b000_1000_0000n,
      ScaleReset:       0b001_0000_0000n,
      ScaleIncrease:    0b010_0000_0000n,
      ScaleDecrease:    0b100_0000_0000n,
    } as const,
  ) satisfies Record<Button, bigint>;

  export const InvertBit: Partial<Record<Button, bigint>> = Immutable(
    {
      LeftPrimary: Bit.RightPrimary,
      RightPrimary: Bit.LeftPrimary,
      UpPrimary: Bit.DownPrimary,
      DownPrimary: Bit.UpPrimary,
    },
  );
}
