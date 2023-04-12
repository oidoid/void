export type Button = Parameters<typeof ButtonSet['has']>[0]
export const ButtonSet = new Set(
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
)

export function* buttonsFromBits(bits: number): Generator<Button> {
  for (const button of ButtonSet) {
    if ((bits & ButtonBit[button]) === ButtonBit[button]) yield button
  }
}

export function buttonsToBits(...buttons: readonly Button[]): number {
  return buttons.reduce((sum, button) => sum | ButtonBit[button], 0)
}

/** Nonzero bit flags. */
// deno-fmt-ignore
export const ButtonBit = {
  Left:             0b000_0000_0001,
  Right:            0b000_0000_0010,
  Up:               0b000_0000_0100,
  Down:             0b000_0000_1000,
  Point:            0b000_0001_0000,
  Action:           0b000_0010_0000,
  Menu:             0b000_0100_0000,
  DebugContextLoss: 0b000_1000_0000,
  ScaleReset:       0b001_0000_0000,
  ScaleIncrease:    0b010_0000_0000,
  ScaleDecrease:    0b100_0000_0000,
} as const satisfies Record<Button, number>

export const InvertButtonBit: Partial<Record<Button, number>> = {
  Left: ButtonBit.Right,
  Right: ButtonBit.Left,
  Up: ButtonBit.Down,
  Down: ButtonBit.Up,
}
