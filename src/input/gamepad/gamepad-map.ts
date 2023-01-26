import { Button } from '@/void'

/**
 * A partial mapping from gmaepad event button / axes indices to logical button.
 * Multiple indices can map to the same logical button.
 */
export interface GamepadMap {
  readonly buttons: Readonly<{ [index: number]: Button }>
  readonly axes: Readonly<{ [index: number]: Button }>
}
