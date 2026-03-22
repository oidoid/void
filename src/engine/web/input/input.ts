// try to start pulling in original code
import type { OnEvent } from '../event.js'
import { Pointer } from './pointer.js'
import { Wheel } from './wheel.js'

export class Input {
  onEvent: OnEvent = () => {}
  readonly #pointer: Pointer = new Pointer(globalThis)
  readonly #wheel: Wheel = new Wheel(globalThis)

  constructor() {
    this.#pointer.onEvent = (ev) => this.onEvent(ev)
    this.#wheel.onEvent = (ev) => this.onEvent(ev)
  }

  register(op: 'add' | 'remove'): void {
    this.#pointer.register(op)
    this.#wheel.register(op)
  }

  write(view: DataView): void {
    view.setInt32(0, this.#pointer.id, true);
    view.setFloat32(4, this.#pointer.x, true);
    view.setFloat32(8, this.#pointer.y, true);
    view.setUint8(12, this.#pointer.device);
    view.setUint8(13, this.#pointer.eventType);
    view.setUint8(14, this.#pointer.primary ? 1 : 0);
    view.setUint8(15, this.#pointer.buttons);
    view.setFloat32(16, this.#wheel.x, true);
    view.setFloat32(20, this.#wheel.y, true);
    view.setFloat32(24, this.#wheel.z, true);
  }
}
