import type {OnEvent} from '../event.ts'
import {maxPointers, pollSize, pollsOffset, wheelOffset} from './layout.ts'
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

  reset(): void {
    this.#pointer.reset()
  }

  write(view: DataView): void {
    const polls = Object.values(this.#pointer.polls)
    const len = Math.min(polls.length, maxPointers)
    view.setUint8(0, len)
    for (let i = 0; i < len; i++) {
      const poll = polls[i]!
      const o = pollsOffset + i * pollSize
      view.setInt32(o, poll.id, true)
      view.setFloat32(o + 4, poll.x, true)
      view.setFloat32(o + 8, poll.y, true)
      view.setFloat32(o + 12, poll.w, true)
      view.setFloat32(o + 16, poll.h, true)
      view.setFloat32(o + 20, poll.pressure, true)
      view.setInt8(o + 24, poll.tiltX)
      view.setInt8(o + 25, poll.tiltY)
      view.setUint16(o + 26, poll.twist, true)
      view.setUint8(o + 28, poll.device)
      view.setUint8(o + 29, poll.primary ? 1 : 0)
      view.setUint8(o + 30, poll.buttons)
    }
    view.setFloat32(wheelOffset, this.#wheel.deltaX, true)
    view.setFloat32(wheelOffset + 4, this.#wheel.deltaY, true)
    view.setFloat32(wheelOffset + 8, this.#wheel.deltaZ, true)
  }
}
