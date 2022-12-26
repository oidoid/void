import { Immutable } from '@/oidlib';

export type PointerButton = Parameters<typeof PointerButton.values['has']>[0];

export namespace PointerButton {
  export const values = Immutable(
    new Set(
      [
        'Point',
        'ClickPrimary',
        'ClickSecondary',
        'ClickAuxiliary',
        'Back',
        'Forward',
      ] as const,
    ),
  );

  export const toMask = Immutable(
    // deno-fmt-ignore
    {
      /** Point has no button state. If the event exists, it's active. */
      Point:          0b000000,
      ClickPrimary:   0b000001,
      ClickSecondary: 0b000010,
      ClickAuxiliary: 0b000100,
      Back:           0b001000,
      Forward:        0b010000,
    } as const,
  ) satisfies Record<PointerButton, number>;
}
