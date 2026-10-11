import * as bridge from '../eng/bridge.ts'
import type {OnEvent} from '../eng/event.ts'
import {ContextMenu} from './context-menu.ts'
import {Gamepad} from './gamepad.ts'
import {Keyboard} from './keyboard.ts'
import {Ptr} from './ptr.ts'
import {Wheel} from './wheel.ts'

export class In {
  onEvent: OnEvent = () => {}
  readonly #ctxMenu: ContextMenu
  readonly #gamepad: Gamepad
  readonly #keyboard: Keyboard
  readonly #encoder: TextEncoder = new TextEncoder()
  readonly #ptr: Ptr
  #u8: Uint8Array = new Uint8Array(0)
  readonly #wheel: Wheel

  constructor(canvas: HTMLCanvasElement) {
    this.#ctxMenu = new ContextMenu(canvas)
    this.#gamepad = new Gamepad(canvas)
    this.#keyboard = new Keyboard(canvas)
    this.#ptr = new Ptr(canvas)
    this.#wheel = new Wheel(canvas)
    this.#gamepad.onEvent = ev => this.onEvent(ev)
    this.#keyboard.onEvent = ev => this.onEvent(ev)
    this.#ptr.onEvent = ev => this.onEvent(ev)
    this.#wheel.onEvent = ev => this.onEvent(ev)
  }

  postupdate(): void {
    this.#keyboard.postupdate()
    this.#ptr.postupdate()
    this.#wheel.postupdate()
  }

  register(op: 'add' | 'remove'): void {
    this.#ctxMenu.register(op)
    this.#gamepad.register(op)
    this.#keyboard.register(op)
    this.#ptr.register(op)
    this.#wheel.register(op)
  }

  reset(): void {
    this.#gamepad.reset()
    this.#keyboard.reset()
    this.#ptr.reset()
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  update(view: DataView): void {
    this.#gamepad.update()
    this.#u8 = writeInPoll(
      view,
      this.#ptr,
      this.#wheel,
      this.#keyboard,
      this.#gamepad,
      this.#encoder,
      this.#u8
    )
  }
}

/** @internal */
export function writeInPoll(
  view: DataView,
  ptr: Ptr,
  wheel: Wheel,
  keyboard: Keyboard,
  gamepad: Gamepad,
  encoder: TextEncoder,
  u8: Uint8Array
): Uint8Array {
  const polls = Object.values(ptr.polls)
  const ptrsLen = Math.min(polls.length, bridge.maxPtrs)
  view.setUint8(bridge.ptrsLenOffset, ptrsLen)
  for (let i = 0; i < ptrsLen; i++) {
    const poll = polls[i]!
    const o = bridge.pollsOffset + i * bridge.pollSize
    view.setInt32(o + bridge.ptrIDOffset, poll.id, true)
    view.setFloat32(o + bridge.ptrMinXOffset, poll.physX, true)
    view.setFloat32(o + bridge.ptrMinYOffset, poll.physY, true)
    view.setFloat32(o + bridge.ptrMaxXOffset, poll.physX + poll.physW, true)
    view.setFloat32(o + bridge.ptrMaxYOffset, poll.physY + poll.physH, true)
    view.setFloat32(o + bridge.ptrPressureOffset, poll.pressure, true)
    view.setInt8(o + bridge.ptrTiltXOffset, poll.tiltX)
    view.setInt8(o + bridge.ptrTiltYOffset, poll.tiltY)
    view.setUint16(o + bridge.ptrTwistOffset, poll.twist, true)
    view.setUint8(o + bridge.ptrDeviceOffset, poll.device)
    view.setUint8(o + bridge.ptrPrimaryOffset, poll.primary ? 1 : 0)
    view.setUint8(o + bridge.ptrClicksOffset, poll.buttons)
  }
  view.setFloat32(
    bridge.wheelOffset + bridge.wheelDeltaXOffset,
    wheel.deltaX,
    true
  )
  view.setFloat32(
    bridge.wheelOffset + bridge.wheelDeltaYOffset,
    wheel.deltaY,
    true
  )
  view.setFloat32(
    bridge.wheelOffset + bridge.wheelDeltaZOffset,
    wheel.deltaZ,
    true
  )
  view.setUint16(bridge.keyboardOffset, keyboard.keys, true)
  const textBytes = encoder.encode(keyboard.text)
  const textLen = Math.min(textBytes.length, bridge.maxTextLen)
  view.setUint16(bridge.keyboardTextLenOffset, textLen, true)
  view.setUint8(
    bridge.keyboardTextOverflowOffset,
    textBytes.length > bridge.maxTextLen ? 1 : 0
  )
  if (u8.buffer !== view.buffer)
    u8 = new Uint8Array(
      view.buffer,
      view.byteOffset + bridge.keyboardTextOffset,
      bridge.maxTextLen
    )
  u8.set(textBytes.subarray(0, textLen))
  const pads = Object.values(gamepad.polls)
  const padsLen = Math.min(pads.length, bridge.maxGamepads)
  view.setUint8(bridge.gamepadsLenOffset, padsLen)
  for (let i = 0; i < padsLen; i++) {
    const pad = pads[i]!
    const o = bridge.gamepadsOffset + i * bridge.gamepadPollSize
    view.setUint8(o + bridge.gamepadIndexOffset, pad.index)
    view.setUint8(o + bridge.gamepadConnectedOffset, pad.connected ? 1 : 0)
    view.setUint8(o + bridge.gamepadMappingOffset, pad.mapping)
    view.setUint16(o + bridge.gamepadButtonsOffset, pad.buttons, true)
    for (let axis = 0; axis < pad.axes.length; axis++)
      view.setFloat32(
        o + bridge.gamepadAxesOffset + axis * bridge.gamepadAxisStride,
        pad.axes[axis]!,
        true
      )
  }
  return u8
}
