import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import type {Gamepad} from './gamepad.ts'
import {writeUpdate} from './input.ts'
import type {Keyboard} from './keyboard.ts'
import {
  keyboardOffset,
  keyboardTextLenOffset,
  keyboardTextOffset,
  keyboardTextOverflowOffset,
  maxTextLen,
  pollSize,
  pollsOffset,
  updateByteLen
} from './layout.ts'
import type {Pointer} from './pointer.ts'
import type {Wheel} from './wheel.ts'

const encoder: TextEncoder = new TextEncoder()

test('writeUpdate()', async ctx => {
  await ctx.test('empty text', () => {
    const view = newView()
    const {pointer, wheel, keyboard, gamepad} = newInputs('')
    writeUpdate(
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
    writeUpdate(
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
    writeUpdate(
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

  await ctx.test('short text is written', () => {
    const view = newView()
    const {pointer, wheel, keyboard, gamepad} = newInputs('hi')
    const u8 = writeUpdate(
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
    writeUpdate(
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
    writeUpdate(
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
    const u8a = writeUpdate(
      view,
      pointer,
      wheel,
      keyboard,
      gamepad,
      encoder,
      new Uint8Array(0)
    )
    const u8b = writeUpdate(
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
    const u8a = writeUpdate(
      view1,
      pointer,
      wheel,
      keyboard,
      gamepad,
      encoder,
      new Uint8Array(0)
    )
    const u8b = writeUpdate(
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
