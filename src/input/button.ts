import { I32, Immutable } from '@/oidlib';

// Logical things.
export type Button = Parameters<typeof Button.values['has']>[0];

export namespace Button {
  export const values = Immutable(
    new Set(
      [
        'Point',
        'ActionPrimary',
        'Menu',
        'DebugContextLoss',
        'ScaleReset',
        'ScaleIncrease',
        'ScaleDecrease',
      ] as const,
    ),
  );

  export function is(button: string): button is Button {
    return values.has(button as Button);
  }

  // No relationship to PointerButton.toBit.
  export const toBit = Immutable(
    // deno-fmt-ignore
    {
      None:             I32(0b000_0000),
      Point:            I32(0b000_0001),
      ActionPrimary:    I32(0b000_0010),
      Menu:             I32(0b000_0100),
      DebugContextLoss: I32(0b000_1000),
      ScaleReset:       I32(0b001_0000),
      ScaleIncrease:    I32(0b010_0000),
      ScaleDecrease:    I32(0b100_0000),
    } as const,
  ) satisfies Record<Button, I32>;
}
