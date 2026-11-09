import {describe, expect, test} from 'bun:test'
import * as bridge from '../eng/bridge.ts'
import type {Gamepad} from './gamepad.ts'
import {writeInPoll} from './in.ts'
import type {Keyboard} from './keyboard.ts'
import type {Ptr} from './ptr.ts'
import type {Wheel} from './wheel.ts'

const encoder: TextEncoder = new TextEncoder()

describe('writeInPoll()', () => {
  test('empty text', () => {
    const view = newView()
    const {ptr, wheel, keyboard, gamepad} = newInputs('')
    writeInPoll(view, ptr, wheel, keyboard, gamepad, encoder, new Uint8Array(0))
    expect(view.getUint16(bridge.keyboardTextLenOffset, true)).toBe(0)
    expect(view.getUint8(bridge.keyboardTextOverflowOffset)).toBe(0)
  })

  test('keys written', () => {
    const view = newView()
    const {ptr, wheel, keyboard, gamepad} = newInputs('', 0b101)
    writeInPoll(view, ptr, wheel, keyboard, gamepad, encoder, new Uint8Array(0))
    expect(view.getUint16(bridge.keyboardOffset, true)).toStrictEqual(0b101)
  })

  test('ptr box writes Go Min and Max', () => {
    const view = newView()
    const {ptr, wheel, keyboard, gamepad} = newInputs('')
    ptr.polls = {
      7: {
        id: 7,
        physX: 10,
        physY: 20,
        physW: 3,
        physH: 4,
        pressure: 0.5,
        tiltX: -1,
        tiltY: 2,
        twist: 30,
        device: 1,
        primary: true,
        buttons: 1
      }
    }
    writeInPoll(view, ptr, wheel, keyboard, gamepad, encoder, new Uint8Array(0))
    const o = bridge.pollsOffset
    expect(view.getInt32(o + bridge.ptrIDOffset, true)).toBe(7)
    expect(view.getFloat32(o + bridge.ptrMinXOffset, true)).toBe(10)
    expect(view.getFloat32(o + bridge.ptrMinYOffset, true)).toBe(20)
    expect(view.getFloat32(o + bridge.ptrMaxXOffset, true)).toBe(13)
    expect(view.getFloat32(o + bridge.ptrMaxYOffset, true)).toBe(24)
    expect(view.getUint8(o + bridge.ptrClicksOffset)).toBe(1)
  })

  test('serializes and deserializes the input portion of Go Poll', () => {
    const view = newView()
    const want = {
      ptrs: [
        {
          id: 7,
          physX: 10,
          physY: 20,
          physW: 3,
          physH: 4,
          pressure: 0.5,
          tiltX: -1,
          tiltY: 2,
          twist: 30,
          device: 2 as const,
          primary: true,
          buttons: 0b101
        }
      ],
      wheel: [1.5, -2.5, 3.5],
      keyboard: {keys: 0b101, text: 'hello world', textOverflow: false},
      gamepads: [
        {
          index: 3,
          connected: true,
          mapping: 1 as const,
          buttons: 0b101,
          axes: [-1, -0.5, 0.5, 1] as const
        }
      ]
    }
    const {ptr, wheel, keyboard, gamepad} = newInputs(
      want.keyboard.text,
      want.keyboard.keys
    )
    ptr.polls = {7: want.ptrs[0]!}
    wheel.deltaX = want.wheel[0]!
    wheel.deltaY = want.wheel[1]!
    wheel.deltaZ = want.wheel[2]!
    gamepad.polls = {3: want.gamepads[0]!}

    writeInPoll(view, ptr, wheel, keyboard, gamepad, encoder, new Uint8Array(0))

    expect(readInPoll(view)).toStrictEqual(want)
  })

  test('short text is written', () => {
    const view = newView()
    const {ptr, wheel, keyboard, gamepad} = newInputs('hi')
    const u8 = writeInPoll(
      view,
      ptr,
      wheel,
      keyboard,
      gamepad,
      encoder,
      new Uint8Array(0)
    )
    expect(view.getUint16(bridge.keyboardTextLenOffset, true)).toBe(2)
    expect(view.getUint8(bridge.keyboardTextOverflowOffset)).toBe(0)
    const written = new TextDecoder().decode(
      new Uint8Array(view.buffer, bridge.keyboardTextOffset, 2)
    )
    expect(written).toBe('hi')
    expect(u8.buffer).toStrictEqual(view.buffer)
  })

  test('text at exact max length, no overflow', () => {
    const view = newView()
    const {ptr, wheel, keyboard, gamepad} = newInputs(
      'a'.repeat(bridge.maxTextLen)
    )
    writeInPoll(view, ptr, wheel, keyboard, gamepad, encoder, new Uint8Array(0))
    expect(view.getUint16(bridge.keyboardTextLenOffset, true)).toStrictEqual(
      bridge.maxTextLen
    )
    expect(view.getUint8(bridge.keyboardTextOverflowOffset)).toBe(0)
  })

  test('text exceeding max length sets overflow', () => {
    const view = newView()
    const {ptr, wheel, keyboard, gamepad} = newInputs(
      'a'.repeat(bridge.maxTextLen + 1)
    )
    writeInPoll(view, ptr, wheel, keyboard, gamepad, encoder, new Uint8Array(0))
    expect(view.getUint16(bridge.keyboardTextLenOffset, true)).toStrictEqual(
      bridge.maxTextLen
    )
    expect(view.getUint8(bridge.keyboardTextOverflowOffset)).toBe(1)
  })

  test('reuses u8 when buffer unchanged', () => {
    const view = newView()
    const {ptr, wheel, keyboard, gamepad} = newInputs('a')
    const u8a = writeInPoll(
      view,
      ptr,
      wheel,
      keyboard,
      gamepad,
      encoder,
      new Uint8Array(0)
    )
    const u8b = writeInPoll(view, ptr, wheel, keyboard, gamepad, encoder, u8a)
    expect(u8a === u8b).toBe(true)
  })

  test('refreshes u8 on buffer change', () => {
    const view1 = newView()
    const view2 = newView()
    const {ptr, wheel, keyboard, gamepad} = newInputs('x')
    const u8a = writeInPoll(
      view1,
      ptr,
      wheel,
      keyboard,
      gamepad,
      encoder,
      new Uint8Array(0)
    )
    const u8b = writeInPoll(view2, ptr, wheel, keyboard, gamepad, encoder, u8a)
    expect(u8b.buffer).toStrictEqual(view2.buffer)
    expect(u8a === u8b).toBe(false)
  })
})
function readInPoll(view: DataView): object {
  const ptrs = []
  for (let i = 0; i < view.getUint8(bridge.ptrsLenOffset); i++) {
    const o = bridge.pollsOffset + i * bridge.pollSize
    const physX = view.getFloat32(o + bridge.ptrMinXOffset, true)
    const physY = view.getFloat32(o + bridge.ptrMinYOffset, true)
    ptrs.push({
      id: view.getInt32(o + bridge.ptrIDOffset, true),
      physX,
      physY,
      physW: view.getFloat32(o + bridge.ptrMaxXOffset, true) - physX,
      physH: view.getFloat32(o + bridge.ptrMaxYOffset, true) - physY,
      pressure: view.getFloat32(o + bridge.ptrPressureOffset, true),
      tiltX: view.getInt8(o + bridge.ptrTiltXOffset),
      tiltY: view.getInt8(o + bridge.ptrTiltYOffset),
      twist: view.getUint16(o + bridge.ptrTwistOffset, true),
      device: view.getUint8(o + bridge.ptrDeviceOffset),
      primary: view.getUint8(o + bridge.ptrPrimaryOffset) !== 0,
      buttons: view.getUint8(o + bridge.ptrClicksOffset)
    })
  }

  const textLen = view.getUint16(bridge.keyboardTextLenOffset, true)
  const gamepads = []
  for (let i = 0; i < view.getUint8(bridge.gamepadsLenOffset); i++) {
    const o = bridge.gamepadsOffset + i * bridge.gamepadPollSize
    gamepads.push({
      index: view.getUint8(o + bridge.gamepadIndexOffset),
      connected: view.getUint8(o + bridge.gamepadConnectedOffset) !== 0,
      mapping: view.getUint8(o + bridge.gamepadMappingOffset),
      buttons: view.getUint16(o + bridge.gamepadButtonsOffset, true),
      axes: [
        view.getFloat32(o + bridge.gamepadAxesOffset, true),
        view.getFloat32(
          o + bridge.gamepadAxesOffset + bridge.gamepadAxisStride,
          true
        ),
        view.getFloat32(
          o + bridge.gamepadAxesOffset + 2 * bridge.gamepadAxisStride,
          true
        ),
        view.getFloat32(
          o + bridge.gamepadAxesOffset + 3 * bridge.gamepadAxisStride,
          true
        )
      ]
    })
  }

  return {
    ptrs,
    wheel: [
      view.getFloat32(bridge.wheelOffset + bridge.wheelDeltaXOffset, true),
      view.getFloat32(bridge.wheelOffset + bridge.wheelDeltaYOffset, true),
      view.getFloat32(bridge.wheelOffset + bridge.wheelDeltaZOffset, true)
    ],
    keyboard: {
      keys: view.getUint16(bridge.keyboardOffset, true),
      text: new TextDecoder().decode(
        new Uint8Array(view.buffer, bridge.keyboardTextOffset, textLen)
      ),
      textOverflow: view.getUint8(bridge.keyboardTextOverflowOffset) !== 0
    },
    gamepads
  }
}

function newInputs(
  text: string = '',
  keys: number = 0
): {
  ptr: Ptr
  wheel: Wheel
  keyboard: Keyboard
  gamepad: Gamepad
} {
  return {
    keyboard: {keys, text} as unknown as Keyboard,
    ptr: {polls: {}} as unknown as Ptr,
    wheel: {deltaX: 0, deltaY: 0, deltaZ: 0} as unknown as Wheel,
    gamepad: {polls: {}} as unknown as Gamepad
  }
}

function newView(): DataView {
  return new DataView(new ArrayBuffer(bridge.updateByteLen))
}
