import { Immutable, Uint } from '@/ooz'

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

  export function fromBits(bits: Uint): Button[] {
    return [...Button.values].filter((button) =>
      (bits & Button.Bit[button]) === Button.Bit[button]
    )
  }

  export function toBits(...buttons: readonly Button[]): Uint {
    // to-do: use Uint-safe OR.
    return buttons.reduce(
      (sum, button) => Uint(sum | Button.Bit[button]),
      Uint(0),
    )
  }

  // No relationship to PointerButton.toBit.
  export const Bit = Immutable(
    // deno-fmt-ignore
    {
      Left:             Uint(0b000_0000_0001),
      Right:            Uint(0b000_0000_0010),
      Up:               Uint(0b000_0000_0100),
      Down:             Uint(0b000_0000_1000),
      Point:            Uint(0b000_0001_0000),
      Action:           Uint(0b000_0010_0000),
      Menu:             Uint(0b000_0100_0000),
      DebugContextLoss: Uint(0b000_1000_0000),
      ScaleReset:       Uint(0b001_0000_0000),
      ScaleIncrease:    Uint(0b010_0000_0000),
      ScaleDecrease:    Uint(0b100_0000_0000),
    } as const,
  ) satisfies Record<Button, Uint>

  export const InvertBit: Partial<Record<Button, Uint>> = Immutable(
    { Left: Bit.Right, Right: Bit.Left, Up: Bit.Down, Down: Bit.Up },
  )
}
