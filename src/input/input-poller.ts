import { XY } from '@/ooz'
import {
  Cam,
  GamepadHub,
  GamepadPoller,
  GlobalEventPub,
  KeyboardPoller,
  PointerEventPub,
  PointerLock,
  PointerPoller,
  PointerType,
  SecureContext,
} from '@/void'

export class InputPoller {
  readonly #gamepad: GamepadPoller
  readonly #keyboard: KeyboardPoller
  readonly #pointer: PointerPoller

  constructor(
    cam: Readonly<Cam>,
    gamepadHub: GamepadHub,
    globalEventPub: GlobalEventPub,
    lock: PointerLock,
    pointerEventPub: PointerEventPub,
    security: SecureContext,
  ) {
    this.#gamepad = new GamepadPoller(gamepadHub, security)
    this.#keyboard = new KeyboardPoller(globalEventPub)
    this.#pointer = new PointerPoller(cam, lock, pointerEventPub)
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

  get sample(): number {
    return this.#gamepad.sample | this.#keyboard.sample | this.#pointer.sample
  }

  /**
   * The fractional level position of the most recent pointer. Undefined when
   * canceled.
   */
  get xy(): Readonly<XY> | undefined {
    return this.#pointer.xy
  }
}
