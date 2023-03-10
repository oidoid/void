import { I16XY } from '@/ooz'
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

  get pointerType(): PointerType | undefined {
    return this.#pointer.pointerType
  }

  get sample(): bigint {
    return this.#gamepad.sample | this.#keyboard.sample | this.#pointer.sample
  }

  get xy(): Readonly<I16XY> | undefined {
    return this.#pointer.xy
  }

  constructor(cam: Readonly<Cam>) {
    this.#pointer = new PointerPoller(cam)
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
}
