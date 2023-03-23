import { I16XY, Uint } from '@/ooz'
import {
  Cam,
  GamepadPoller,
  KeyboardPoller,
  PointerPoller,
  PointerType,
} from '@/void'

export class InputPoller {
  readonly #gamepad: GamepadPoller = new GamepadPoller()
  readonly #keyboard: KeyboardPoller = new KeyboardPoller()
  readonly #pointer: PointerPoller

  constructor(cam: Readonly<Cam>) {
    this.#pointer = new PointerPoller(cam)
  }

  get pointerType(): PointerType | undefined {
    return this.#pointer.pointerType
  }

  preupdate(): void {
    this.#gamepad.preupdate()
  }

  postupdate(): void {
    this.#pointer.postupdate()
  }

  register(op: 'add' | 'remove'): void {
    this.#keyboard.register(op)
    this.#pointer.register(op)
  }

  reset(): void {
    this.#gamepad.reset()
    this.#keyboard.reset()
    this.#pointer.reset()
  }

  get sample(): Uint {
    // to-do: use Uint-safe or.
    return Uint(
      this.#gamepad.sample | this.#keyboard.sample | this.#pointer.sample,
    )
  }

  get xy(): Readonly<I16XY> | undefined {
    return this.#pointer.xy
  }
}
