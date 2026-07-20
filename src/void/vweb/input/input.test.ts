import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import type {Gamepad} from './gamepad.ts'
import {writeInputPoll} from './input.ts'
import type {Keyboard} from './keyboard.ts'
import {
  gamepadPollSize,
  gamepadsLenOffset,
  gamepadsOffset,
  keyboardOffset,
  keyboardTextLenOffset,
  keyboardTextOffset,
  keyboardTextOverflowOffset,
  maxTextLen,
  pollSize,
  pollsOffset,
  updateByteLen,
  wheelOffset
} from './layout.ts'
import type {Pointer} from './pointer.ts'
import type {Wheel} from './wheel.ts'

const encoder: TextEncoder = new TextEncoder()

test('writeInputPoll()', async ctx => {
  await ctx.test('empty text', () => {
    const view = newView()
    const {pointer, wheel, keyboard, gamepad} = newInputs('')
    writeInputPoll(
      view,
      pointer,
      wheel,
      keyboard,
      gamepad,
      encoder,
      new Uint8Array(0)
    )
    assert(view.getUint16(keyboardTextLenOffset, true), 0)
    assert(view.getUint8(keyboardTextOverflowOffset), 0)
  })

  await ctx.test('keys written', () => {
    const view = newView()
    const {pointer, wheel, keyboard, gamepad} = newInputs('', 0b101)
    writeInputPoll(
      view,
      pointer,
      wheel,
      keyboard,
      gamepad,
      encoder,
      new Uint8Array(0)
    )
    assert(view.getUint16(keyboardOffset, true), 0b101)
  })

  await ctx.test('pointer box writes Go Min and Max', () => {
    const view = newView()
    const {pointer, wheel, keyboard, gamepad} = newInputs('')
    pointer.polls = {
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
    writeInputPoll(
      view,
      pointer,
      wheel,
      keyboard,
      gamepad,
      encoder,
      new Uint8Array(0)
    )
    const o = pollsOffset
    assert(view.getInt32(o, true), 7)
    assert(view.getFloat32(o + 4, true), 10)
    assert(view.getFloat32(o + 8, true), 20)
    assert(view.getFloat32(o + 12, true), 13)
    assert(view.getFloat32(o + 16, true), 24)
    assert(view.getUint8(o + pollSize - 2), 1)
  })

  await ctx.test(
    'serializes and deserializes the input portion of Go Poll',
    () => {
      const view = newView()
      const want = {
        pointers: [
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
      const {pointer, wheel, keyboard, gamepad} = newInputs(
        want.keyboard.text,
        want.keyboard.keys
      )
      pointer.polls = {7: want.pointers[0]!}
      wheel.deltaX = want.wheel[0]!
      wheel.deltaY = want.wheel[1]!
      wheel.deltaZ = want.wheel[2]!
      gamepad.polls = {3: want.gamepads[0]!}

      writeInputPoll(
        view,
        pointer,
        wheel,
        keyboard,
        gamepad,
        encoder,
        new Uint8Array(0)
      )

      assert(readInputPoll(view), want)
    }
  )

  await ctx.test('short text is written', () => {
    const view = newView()
    const {pointer, wheel, keyboard, gamepad} = newInputs('hi')
    const u8 = writeInputPoll(
      view,
      pointer,
      wheel,
      keyboard,
      gamepad,
      encoder,
      new Uint8Array(0)
    )
    assert(view.getUint16(keyboardTextLenOffset, true), 2)
    assert(view.getUint8(keyboardTextOverflowOffset), 0)
    const written = new TextDecoder().decode(
      new Uint8Array(view.buffer, keyboardTextOffset, 2)
    )
    assert(written, 'hi')
    assert(u8.buffer, view.buffer)
  })

  await ctx.test('text at exact max length, no overflow', () => {
    const view = newView()
    const {pointer, wheel, keyboard, gamepad} = newInputs(
      'a'.repeat(maxTextLen)
    )
    writeInputPoll(
      view,
      pointer,
      wheel,
      keyboard,
      gamepad,
      encoder,
      new Uint8Array(0)
    )
    assert(view.getUint16(keyboardTextLenOffset, true), maxTextLen)
    assert(view.getUint8(keyboardTextOverflowOffset), 0)
  })

  await ctx.test('text exceeding max length sets overflow', () => {
    const view = newView()
    const {pointer, wheel, keyboard, gamepad} = newInputs(
      'a'.repeat(maxTextLen + 1)
    )
    writeInputPoll(
      view,
      pointer,
      wheel,
      keyboard,
      gamepad,
      encoder,
      new Uint8Array(0)
    )
    assert(view.getUint16(keyboardTextLenOffset, true), maxTextLen)
    assert(view.getUint8(keyboardTextOverflowOffset), 1)
  })

  await ctx.test('reuses u8 when buffer unchanged', () => {
    const view = newView()
    const {pointer, wheel, keyboard, gamepad} = newInputs('a')
    const u8a = writeInputPoll(
      view,
      pointer,
      wheel,
      keyboard,
      gamepad,
      encoder,
      new Uint8Array(0)
    )
    const u8b = writeInputPoll(
      view,
      pointer,
      wheel,
      keyboard,
      gamepad,
      encoder,
      u8a
    )
    assert(u8a === u8b, true)
  })

  await ctx.test('refreshes u8 on buffer change', () => {
    const view1 = newView()
    const view2 = newView()
    const {pointer, wheel, keyboard, gamepad} = newInputs('x')
    const u8a = writeInputPoll(
      view1,
      pointer,
      wheel,
      keyboard,
      gamepad,
      encoder,
      new Uint8Array(0)
    )
    const u8b = writeInputPoll(
      view2,
      pointer,
      wheel,
      keyboard,
      gamepad,
      encoder,
      u8a
    )
    assert(u8b.buffer, view2.buffer)
    assert(u8a === u8b, false)
  })
})
function readInputPoll(view: DataView): object {
  const pointers = []
  for (let i = 0; i < view.getUint8(0); i++) {
    const o = pollsOffset + i * pollSize
    const physX = view.getFloat32(o + 4, true)
    const physY = view.getFloat32(o + 8, true)
    pointers.push({
      id: view.getInt32(o, true),
      physX,
      physY,
      physW: view.getFloat32(o + 12, true) - physX,
      physH: view.getFloat32(o + 16, true) - physY,
      pressure: view.getFloat32(o + 20, true),
      tiltX: view.getInt8(o + 24),
      tiltY: view.getInt8(o + 25),
      twist: view.getUint16(o + 26, true),
      device: view.getUint8(o + 28),
      primary: view.getUint8(o + 29) !== 0,
      buttons: view.getUint8(o + 30)
    })
  }

  const textLen = view.getUint16(keyboardTextLenOffset, true)
  const gamepads = []
  for (let i = 0; i < view.getUint8(gamepadsLenOffset); i++) {
    const o = gamepadsOffset + i * gamepadPollSize
    gamepads.push({
      index: view.getUint8(o),
      connected: view.getUint8(o + 1) !== 0,
      mapping: view.getUint8(o + 2),
      buttons: view.getUint32(o + 4, true),
      axes: [
        view.getFloat32(o + 8, true),
        view.getFloat32(o + 12, true),
        view.getFloat32(o + 16, true),
        view.getFloat32(o + 20, true)
      ]
    })
  }

  return {
    pointers,
    wheel: [
      view.getFloat32(wheelOffset, true),
      view.getFloat32(wheelOffset + 4, true),
      view.getFloat32(wheelOffset + 8, true)
    ],
    keyboard: {
      keys: view.getUint16(keyboardOffset, true),
      text: new TextDecoder().decode(
        new Uint8Array(view.buffer, keyboardTextOffset, textLen)
      ),
      textOverflow: view.getUint8(keyboardTextOverflowOffset) !== 0
    },
    gamepads
  }
}

function newInputs(
  text: string = '',
  keys: number = 0
): {
  pointer: Pointer
  wheel: Wheel
  keyboard: Keyboard
  gamepad: Gamepad
} {
  return {
    keyboard: {keys, text} as unknown as Keyboard,
    pointer: {polls: {}} as unknown as Pointer,
    wheel: {deltaX: 0, deltaY: 0, deltaZ: 0} as unknown as Wheel,
    gamepad: {polls: {}} as unknown as Gamepad
  }
}

function newView(): DataView {
  return new DataView(new ArrayBuffer(updateByteLen))
}
