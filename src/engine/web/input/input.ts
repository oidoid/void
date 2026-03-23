// try to start pulling in original code
import type {OnEvent} from '../event.ts'
import {Pointer} from './pointer.ts'
import {Wheel} from './wheel.ts'

export class Input {
  onEvent: OnEvent = () => {}
  readonly #pointer: Pointer = new Pointer(globalThis)
  readonly #wheel: Wheel = new Wheel(globalThis)

  constructor() {
    this.#pointer.onEvent = ev => this.onEvent(ev)
    this.#wheel.onEvent = ev => this.onEvent(ev)
  }

  register(op: 'add' | 'remove'): void {
    this.#pointer.register(op)
    this.#wheel.register(op)
  }

  write(view: DataView): void {
    view.setInt32(0, this.#pointer.id, true)
    view.setFloat32(4, this.#pointer.x, true)
    view.setFloat32(8, this.#pointer.y, true)
    view.setFloat32(12, this.#pointer.w, true)
    view.setFloat32(16, this.#pointer.h, true)
    view.setFloat32(20, this.#pointer.pressure, true)
    view.setInt8(24, this.#pointer.tiltX)
    view.setInt8(25, this.#pointer.tiltY)
    view.setUint16(26, this.#pointer.twist, true)
    view.setUint8(28, this.#pointer.device)
    view.setUint8(29, this.#pointer.primary ? 1 : 0)
    view.setUint8(30, this.#pointer.buttons)
    view.setFloat32(32, this.#wheel.deltaX, true)
    view.setFloat32(36, this.#wheel.deltaY, true)
    view.setFloat32(40, this.#wheel.deltaZ, true)
  }
}
