import { I32 } from '@/oidlib';

export interface GamepadButtonInput {
  /**
   * Logical state of gamepad nondirectional buttons. The original encoding is
   * not preserved.
   */
  readonly buttons: I32;
  /** How long the button state has persisted. 0 (triggered) on state change. */
  readonly duration: number;
}

export interface GamepadDirectionInput {
  /**
   * Logical state of gamepad directional buttons. The original encoding is
   * not preserved.
   */
  readonly directions: I32;
  /**
   * How long the direction state has persisted. 0 (triggered) on state change.
   */
  readonly duration: number;
}

export function GamepadButtonInput(
  buttons: I32,
  duration: number,
): GamepadButtonInput {
  return { buttons, duration };
}

export function GamepadDirectionInput(
  directions: I32,
  duration: number,
): GamepadDirectionInput {
  return { directions, duration };
}
