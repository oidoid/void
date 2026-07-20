import type {OnEvent} from '../engine/event.ts'
import {ContextMenu} from './context-menu.ts'
import {Gamepad} from './gamepad.ts'
import {Keyboard} from './keyboard.ts'
import {
  gamepadPollSize,
  gamepadsLenOffset,
  gamepadsOffset,
  keyboardOffset,
  keyboardTextLenOffset,
  keyboardTextOffset,
  keyboardTextOverflowOffset,
  maxGamepads,
  maxPointers,
  maxTextLen,
  pollSize,
  pollsOffset,
  wheelOffset
} from './layout.ts'
import {Pointer} from './pointer.ts'
import {Wheel} from './wheel.ts'

export class Input {
  onEvent: OnEvent = () => {}
  readonly #ctxMenu: ContextMenu
  readonly #gamepad: Gamepad
  readonly #keyboard: Keyboard
  readonly #encoder: TextEncoder = new TextEncoder()
  readonly #pointer: Pointer
  #u8: Uint8Array = new Uint8Array(0)
  readonly #wheel: Wheel

  constructor(canvas: HTMLCanvasElement) {
    this.#ctxMenu = new ContextMenu(canvas)
    this.#gamepad = new Gamepad(canvas)
    this.#keyboard = new Keyboard(canvas)
    this.#pointer = new Pointer(canvas)
    this.#wheel = new Wheel(canvas)
    this.#gamepad.onEvent = ev => this.onEvent(ev)
    this.#keyboard.onEvent = ev => this.onEvent(ev)
    this.#pointer.onEvent = ev => this.onEvent(ev)
    this.#wheel.onEvent = ev => this.onEvent(ev)
  }

  postupdate(): void {
    this.#keyboard.postupdate()
    this.#wheel.postupdate()
  }

  register(op: 'add' | 'remove'): void {
    this.#ctxMenu.register(op)
    this.#gamepad.register(op)
    this.#keyboard.register(op)
    this.#pointer.register(op)
    this.#wheel.register(op)
  }

  reset(): void {
    // to-do: review.
    this.#gamepad.reset()
    this.#keyboard.reset()
    this.#pointer.reset()
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  update(view: DataView): void {
    this.#gamepad.update()
    this.#u8 = writeInputPoll(
      view,
      this.#pointer,
      this.#wheel,
      this.#keyboard,
      this.#gamepad,
      this.#encoder,
      this.#u8
    )
  }
}

/** @internal */
export function writeInputPoll(
  view: DataView,
  pointer: Pointer,
  wheel: Wheel,
  keyboard: Keyboard,
  gamepad: Gamepad,
  encoder: TextEncoder,
  u8: Uint8Array
): Uint8Array {
  const polls = Object.values(pointer.polls)
  const pointersLen = Math.min(polls.length, maxPointers)
  view.setUint8(0, pointersLen)
  for (let i = 0; i < pointersLen; i++) {
    const poll = polls[i]!
    const o = pollsOffset + i * pollSize
    view.setInt32(o, poll.id, true)
    view.setFloat32(o + 4, poll.physX, true)
    view.setFloat32(o + 8, poll.physY, true)
    view.setFloat32(o + 12, poll.physX + poll.physW, true)
    view.setFloat32(o + 16, poll.physY + poll.physH, true)
    view.setFloat32(o + 20, poll.pressure, true)
    view.setInt8(o + 24, poll.tiltX)
    view.setInt8(o + 25, poll.tiltY)
    view.setUint16(o + 26, poll.twist, true)
    view.setUint8(o + 28, poll.device)
    view.setUint8(o + 29, poll.primary ? 1 : 0)
    view.setUint8(o + 30, poll.buttons)
  }
  view.setFloat32(wheelOffset, wheel.deltaX, true)
  view.setFloat32(wheelOffset + 4, wheel.deltaY, true)
  view.setFloat32(wheelOffset + 8, wheel.deltaZ, true)
  view.setUint16(keyboardOffset, keyboard.keys, true)
  const textBytes = encoder.encode(keyboard.text)
  const textLen = Math.min(textBytes.length, maxTextLen)
  view.setUint16(keyboardTextLenOffset, textLen, true)
  view.setUint8(
    keyboardTextOverflowOffset,
    textBytes.length > maxTextLen ? 1 : 0
  )
  if (u8.buffer !== view.buffer)
    u8 = new Uint8Array(
      view.buffer,
      view.byteOffset + keyboardTextOffset,
      maxTextLen
    )
  u8.set(textBytes.subarray(0, textLen))
  const pads = Object.values(gamepad.polls)
  const padsLen = Math.min(pads.length, maxGamepads)
  view.setUint8(gamepadsLenOffset, padsLen)
  for (let i = 0; i < padsLen; i++) {
    const pad = pads[i]!
    const o = gamepadsOffset + i * gamepadPollSize
    view.setUint8(o, pad.index)
    view.setUint8(o + 1, pad.connected ? 1 : 0)
    view.setUint8(o + 2, pad.mapping)
    view.setUint32(o + 4, pad.buttons, true)
    view.setFloat32(o + 8, pad.axes[0], true)
    view.setFloat32(o + 12, pad.axes[1], true)
    view.setFloat32(o + 16, pad.axes[2], true)
    view.setFloat32(o + 20, pad.axes[3], true)
  }
  return u8
}
