import { Immutable } from '@/oidlib'

export type Button = Parameters<typeof Button.values['has']>[0]

export namespace Button {
  export const values = Immutable(
    new Set(
      [
        'Point',
        'Left',
        'Right',
        'Up',
        'Down',
        'Action',
        'Menu',
        'DebugContextLoss',
        'ScaleReset',
        'ScaleIncrease',
        'ScaleDecrease',
      ] as const,
    ),
  )

  export function fromBits(bits: bigint): Button[] {
    return [...Button.values].filter((button) =>
      (bits & Button.Bit[button]) == Button.Bit[button]
    )
  }

  export function toBits(...buttons: readonly Button[]): bigint {
    return buttons.reduce((sum, button) => sum | Button.Bit[button], 0n)
  }

  // No relationship to PointerButton.toBit.
  export const Bit = Immutable(
    // deno-fmt-ignore
    {
      Left:             0b000_0000_0001n,
      Right:            0b000_0000_0010n,
      Up:               0b000_0000_0100n,
      Down:             0b000_0000_1000n,
      Point:            0b000_0001_0000n,
      Action:           0b000_0010_0000n,
      Menu:             0b000_0100_0000n,
      DebugContextLoss: 0b000_1000_0000n,
      ScaleReset:       0b001_0000_0000n,
      ScaleIncrease:    0b010_0000_0000n,
      ScaleDecrease:    0b100_0000_0000n,
    } as const,
  ) satisfies Record<Button, bigint>

  export const InvertBit: Partial<Record<Button, bigint>> = Immutable(
    { Left: Bit.Right, Right: Bit.Left, Up: Bit.Down, Down: Bit.Up },
  )
}
