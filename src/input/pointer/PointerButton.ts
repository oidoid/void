import { I32, Immutable } from '@/oidlib';
import { pointerMap } from '@/void';

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

  export const toBit = Immutable(
    // deno-fmt-ignore
    {
      /** Point has no button state. If the event exists, it's active. */
      Point:          I32(0b0_0000),
      ClickPrimary:   I32(0b0_0001),
      ClickSecondary: I32(0b0_0010),
      ClickAuxiliary: I32(0b0_0100),
      Back:           I32(0b0_1000),
      Forward:        I32(0b1_0000),
    } as const,
  ) satisfies Record<PointerButton, I32>;

  export const fromInput = Immutable(pointerMap);
}
