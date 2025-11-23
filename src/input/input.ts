import type {Cam, LevelClientLocalXY} from '../graphics/cam.ts'
import type {XY, XYZ} from '../types/geo.ts'
import type {Millis} from '../types/time.ts'
import {ContextMenu} from './context-menu.ts'
import {Gamepad} from './gamepad.ts'
import {Keyboard} from './keyboard.ts'
import type {PointType} from './pointer.ts'
import {Pointer} from './pointer.ts'
import {Wheel} from './wheel.ts'

export type Chord<Button> = [Button, ...Button[]]
export type Combo<Button> = [Chord<Button>, ...Chord<Button>[]]

export type InputMode = 'Default' | 'Custom'

// biome-ignore format:;
export type DefaultButton =
  | 'U' | 'D' | 'L' | 'R' // dpad.
  | 'A' | 'B' | 'C'       // primary, secondary, tertiary.
  | 'Click' | 'Click2' | 'ClickMiddle'
  | 'Menu' | 'Back'

export type Point = LevelClientLocalXY & {
  click: LevelClientLocalXY | undefined
  type: PointType | undefined
}

/**
 * doesn't consider handled. local and level positions are reevaluated each
 * frame.
 */
type PointerState = Point & {
  center: LevelClientLocalXY
  /** false when pinched. */
  drag: {on: boolean; start: boolean; end: boolean}
  /** true if changed since last update. */
  invalid: boolean
  /** may be negative. */
  pinch:
    | {
        client: XY
        /** level / local. */
        xy: XY
      }
    | undefined
  /** secondary points. */
  secondary: Point[]
}

/** triggered. */
type WheelState = {
  delta: {
    client: Readonly<XYZ>
    /** level / local. */
    xy: XY
  }
}

/**
 * input device abstraction. aggregates devices, records history, and provides
 * a convenient API.
 *
 * devices own as much device-specific detail and as little coordination (time
 * and device) as practical. devices avoid caching state which is the
 * responsibility of Input. devices strive to provide the current state and
 * nothing else.
 *
 * if you miss reporting on a event between long updates, you just miss it.
 * that's the nature of polling. there's no queue.
 *
 * to-do: expose analog state of gamepad. offer direction as a number instead of
 *        bool.
 * to-do: multiplayer. possible if devices were requested instead of sought.
 * to-do: expose input source device.
 */
export class Input<Button extends string> {
  /** time allowed between combo inputs. */
  comboMaxIntervalMillis: Millis = 300 as Millis
  /**
   * true if any button, key, or click was _ever_ on. doesn't consider handled.
   */
  gestured: boolean = false
  /** clear buttonish inputs for rest of frame. */
  handled: boolean = false
  /** true if _any_ input has changed since previous update. */
  invalid: boolean = false
  /**
   * minimum duration for an input to be considered held. durations are
   * calculated at frame boundaries, not on actual press. devices are treated
   * strictly as polled aggregates.
   */
  minHeldMillis: Millis = 300 as Millis
  readonly #bitByButton: {[btn in Button]?: number} = {}
  readonly #buttonByBit: {[bit: number]: Button} = {}
  #bits: number = 0
  readonly #cam: Readonly<Cam>
  /**
   * sequence of nonzero bits ordered from oldest to latest. combos end only by
   * expiration.
   */
  readonly #combo: number[] = []
  readonly #contextMenu: ContextMenu
  /** direction vector. */
  readonly #dir: XY = {x: 0, y: 0}
  readonly #gamepad: Gamepad
  /** time since buttons changed. */
  #heldMillis: Millis = 0
  readonly #keyboard: Keyboard
  readonly #pointer: Pointer
  #pointerState: PointerState | undefined
  /** bits last update. may not be equal to `#combo.at(-1)`. */
  #prevBits: number = 0
  readonly #wheel: Wheel
  #wheelState: Readonly<WheelState> | undefined

  constructor(cam: Readonly<Cam>, target: Element) {
    this.#cam = cam
    this.#contextMenu = new ContextMenu(target)
    this.#gamepad = new Gamepad(globalThis)
    this.#keyboard = new Keyboard(target.ownerDocument)
    this.#pointer = new Pointer(target)
    this.#wheel = new Wheel(target)
  }

  get anyOn(): boolean {
    return this.#bits !== 0
  }

  /** for debugging. */
  get combo(): Button[][] {
    const chords: Button[][] = []
    for (const bits of this.#combo) {
      const chord: Button[] = []
      for (let bit = 1; bit <= bits; bit <<= 1) {
        if ((bit & bits) === bit && this.#buttonByBit[bit])
          chord.push(this.#buttonByBit[bit]!)
      }
      chord.sort()
      chords.push(chord)
    }
    return chords
  }

  /**
   * enable when game is paused or in photo mode to allow right clicks and long
   * presses to save canvas.
   */
  get contextMenu(): {enable: boolean} {
    return this.#contextMenu
  }

  get dir(): Readonly<XY> {
    return this.#dir
  }

  /** doesn't consider handled. gamepads must be polled. */
  get gamepad(): Readonly<object | undefined> {
    return this.#gamepad.connected ? {} : undefined
  }

  /** true if buttons haven't changed for a while. */
  get held(): boolean {
    return !this.handled && this.#heldMillis >= this.minHeldMillis
  }

  isAnyOn(...btns: Readonly<Chord<Button>>): boolean {
    return !this.handled && !!(this.#bits & this.#mapBits(btns))
  }

  isAnyOnStart(...btns: Readonly<Chord<Button>>): boolean {
    return this.started && this.isAnyOn(...btns)
  }

  /** true if on for at least two frames. */
  isAnyOnStill(...btns: Readonly<Chord<Button>>): boolean {
    const bits = this.#mapBits(btns)
    return !this.handled && !!(this.#bits & this.#prevBits & bits)
  }

  /** true if any buttons have started on or off. */
  isAnyStarted(...btns: Readonly<Chord<Button>>): boolean {
    const bits = this.#mapBits(btns)
    return !this.handled && (this.#bits & bits) !== (this.#prevBits & bits)
  }

  /**
   * buttons are exact. eg, up won't match up AND down like `isOn('U')` will.
   * combo is exact too. `['A'], ['A']` will match `['A'], ['A']` but not
   * `['A'], ['A'], ['A']`.
   */
  isCombo(...combo: Readonly<Combo<Button>>): boolean {
    return combo.length === this.#combo.length && this.isComboEndsWith(...combo)
  }

  /**
   * `['A'], ['A']` will match `['A'], ['A']` and `['B'], ['A'], ['A']`. eg,
   * double-clicks often don't care about any preceding buttons.
   */
  isComboEndsWith(...combo: Readonly<Combo<Button>>): boolean {
    for (const [i, btns] of combo.entries()) {
      const bits = this.#mapBits(btns)
      if (this.#combo.at(-combo.length + i) !== bits) return false
    }
    // #combo is a historical record of buttons. whenever buttons changes, a new
    // entry is pushed. make sure the current entry is the current state.
    return !this.handled && (this.#combo.at(-1) === this.#bits || !this.#bits)
  }

  /** like isComboEndsWith() but test if the last button is triggered. */
  isComboEndsWithStart(...combo: Readonly<Combo<Button>>): boolean {
    // isOnStart() can handle zero-length.
    return this.isOnStart(...combo.at(-1)!) && this.isComboEndsWith(...combo)
  }

  /** like isCombo() but test if the last button is triggered. */
  isComboStart(...combo: Readonly<Combo<Button>>): boolean {
    return this.isOnStart(...combo.at(-1)!) && this.isCombo(...combo)
  }

  /*:
   * true if any button in chord is not on. this is usually what's wanted. eg:
   * ```ts
   * if (isOn('A', 'B')) console.log('on')
   * if (isOff('A', 'B')) console.log('not A+B; A and/or B is off')
   * ```
   */
  isOff(...btns: Readonly<Chord<Button>>): boolean {
    return !this.handled && !this.isOn(...btns)
  }

  isOffStart(...btns: Readonly<Chord<Button>>): boolean {
    const bits = this.#mapBits(btns)
    const wasOn = (this.#prevBits & bits) === bits
    // don't test this.#bits === 0 since it might forever miss the off event for
    // the specific bits.
    return wasOn && this.started && this.isOff(...btns)
  }

  /**
   * true if all buttons are on inclusively. eg, `isOn('U')` is true when up is
   * pressed or when up and down are pressed.
   */
  isOn(...btns: Readonly<Chord<Button>>): boolean {
    const bits = this.#mapBits(btns)
    return !this.handled && (this.#bits & bits) === bits
  }

  isOnStart(...btns: Readonly<Chord<Button>>): boolean {
    return this.started && this.isOn(...btns)
  }

  get key(): {invalid: boolean} {
    return {invalid: this.#keyboard.invalid}
  }

  mapDefault(): Input<Button | DefaultButton> {
    const input = this as Input<Button | DefaultButton>
    input.mapKeyboardCode('U', 'ArrowUp')
    input.mapKeyboardCode('D', 'ArrowDown')
    input.mapKeyboardCode('L', 'ArrowLeft')
    input.mapKeyboardCode('R', 'ArrowRight')
    input.mapKeyboardCode('C', 'KeyC')
    input.mapKeyboardCode('A', 'KeyX')
    input.mapKeyboardCode('B', 'KeyZ')
    input.mapKeyboardCode('Menu', 'Enter')
    input.mapKeyboardCode('Back', 'Escape')

    // https://w3c.github.io/gamepad/#remapping
    input.mapGamepadAxis('U', 'D', 1, 3)
    input.mapGamepadAxis('L', 'R', 0, 2)
    input.mapGamepadButton('U', 12)
    input.mapGamepadButton('D', 13)
    input.mapGamepadButton('L', 14)
    input.mapGamepadButton('R', 15)
    input.mapGamepadButton('C', 2)
    input.mapGamepadButton('B', 0) // to-do: not good from PS perspective.
    input.mapGamepadButton('A', 1) // to-do: not good from PS perspective.
    input.mapGamepadButton('Menu', 9)
    input.mapGamepadButton('Back', 8)

    input.mapPointerClick('Click', 1)
    input.mapPointerClick('Click2', 2)
    input.mapPointerClick('ClickMiddle', 4)
    return input
  }

  // to-do: support analog values.
  mapGamepadAxis(less: Button, more: Button, ...axes: readonly number[]): void {
    for (const axis of axes) {
      this.#gamepad.bitByAxis[axis] = [
        this.#mapButton(less),
        this.#mapButton(more)
      ]
    }
  }

  mapGamepadButton(btn: Button, ...indices: readonly number[]): void {
    for (const index of indices)
      this.#gamepad.bitByButton[index] = this.#mapButton(btn)
  }

  /** @arg codes union of KeyboardEvent.code. */
  mapKeyboardCode(btn: Button, ...codes: readonly string[]): void {
    for (const code of codes)
      this.#keyboard.bitByCode[code] = this.#mapButton(btn)
  }

  mapPointerClick(btn: Button, ...clicks: readonly number[]): void {
    for (const click of clicks)
      this.#pointer.bitByButton[click] = this.#mapButton(btn)
  }

  get on(): Button[] {
    const on: Button[] = []
    for (const btn in this.#bitByButton) if (this.isOn(btn)) on.push(btn)
    return on.sort()
  }

  set onEvent(hook: () => void) {
    this.#gamepad.onEvent = hook
    this.#keyboard.onEvent = hook
    this.#pointer.onEvent = hook
    this.#wheel.onEvent = hook
  }

  /** doesn't consider handled. */
  get point(): PointerState | undefined {
    return this.#pointerState
  }

  get pointer(): {dragMinClient: number} {
    return this.#pointer
  }

  register(op: 'add' | 'remove'): this {
    globalThis[`${op}EventListener`]('blur', this.reset) // keyup is lost if window loses focus.
    this.#contextMenu.register(op)
    this.#gamepad.register(op)
    this.#keyboard.register(op)
    this.#pointer.register(op)
    this.#wheel.register(op)
    return this
  }

  reset = (): void => {
    this.#bits = 0
    this.#prevBits = 0
    this.handled = false
    this.#heldMillis = 0
    this.#combo.length = 0
    this.#gamepad.reset()
    this.#keyboard.reset()
    this.#pointer.reset()
    this.#pointerState = undefined
    this.#wheel.reset()
    this.#wheelState = undefined
  }

  /** true if bits has changed. */
  get started(): boolean {
    return !this.handled && this.#bits !== this.#prevBits
  }

  /**
   * call on new frame before altering cam. dispatches always occur before an
   * update.
   * @arg millis duration since last update.
   */
  update(millis: Millis): void {
    this.handled = false
    this.#gamepad.update()
    this.#pointer.update()

    this.#prevBits = this.#bits
    this.#bits =
      this.#gamepad.bits |
      this.#keyboard.bits |
      (this.#pointer.primary?.bits ?? 0)
    this.invalid =
      this.#bits !== this.#prevBits ||
      this.#pointer.invalid ||
      !!this.#wheel.deltaClient
    this.gestured ||= !!this.#bits

    this.#dir.x = this.#dir.y = 0
    if (
      (this.#bitByButton['U' as Button]! & this.#bits) ===
      this.#bitByButton['U' as Button]
    )
      this.#dir.y -= 1
    if (
      (this.#bitByButton['D' as Button]! & this.#bits) ===
      this.#bitByButton['D' as Button]
    )
      this.#dir.y += 1
    if (
      (this.#bitByButton['L' as Button]! & this.#bits) ===
      this.#bitByButton['L' as Button]
    )
      this.#dir.x -= 1
    if (
      (this.#bitByButton['R' as Button]! & this.#bits) ===
      this.#bitByButton['R' as Button]
    )
      this.#dir.x += 1

    if (
      (millis > this.comboMaxIntervalMillis && this.#bits !== this.#prevBits) ||
      (this.#heldMillis + millis > this.comboMaxIntervalMillis && !this.#bits)
    )
      this.#combo.length = 0

    if (this.#bits === this.#prevBits)
      this.#heldMillis = (this.#heldMillis + millis) as Millis
    else this.#heldMillis = millis

    if (this.#bits && this.#bits !== this.#prevBits) {
      if (this.#prevBits) this.#combo.length = 0 // new button without release.
      this.#combo.push(this.#bits)
    }

    if (this.#pointer.primary) {
      const pinchClient = this.#pointer.pinchClient
      const dragOn =
        this.#pointer.primary.drag &&
        !Object.values(this.#pointer.secondary).length
      const secondary: Point[] = []
      for (const pt of Object.values(this.#pointer.secondary)) {
        secondary.push({
          type: pt.type,
          click: pt.clickClient
            ? {
                client: pt.clickClient,
                local: this.#cam.clientToXYLocal(pt.clickClient),
                ...this.#cam.clientToXY(pt.clickClient)
              }
            : undefined,
          ...this.#cam.clientToXY(pt.xyClient),
          client: pt.xyClient,
          local: this.#cam.clientToXYLocal(pt.xyClient)
        })
      }
      const centerClient = this.#pointer.centerClient!
      const center = {
        client: centerClient,
        local: this.#cam.clientToXYLocal(centerClient),
        ...this.#cam.clientToXY(centerClient)
      }
      this.#pointerState = {
        center,
        click: this.#pointer.primary.clickClient
          ? {
              client: this.#pointer.primary.clickClient,
              local: this.#cam.clientToXYLocal(
                this.#pointer.primary.clickClient
              ),
              ...this.#cam.clientToXY(this.#pointer.primary.clickClient)
            }
          : undefined,
        drag: {
          on: dragOn,
          start: !this.#pointerState?.drag.on && dragOn,
          end: !!this.#pointerState?.drag.on && !dragOn
        },
        invalid: this.#pointer.invalid,
        pinch: pinchClient
          ? {client: pinchClient, xy: this.#cam.clientToXY(pinchClient)}
          : undefined,
        secondary,
        type: this.#pointer.primary.type,
        ...this.#cam.clientToXY(this.#pointer.primary.xyClient),
        client: this.#pointer.primary.xyClient,
        local: this.#cam.clientToXYLocal(this.#pointer.primary.xyClient)
      }
    }
    // secondary should never be set when primary isn't.
    else this.#pointerState = undefined

    this.#wheelState = this.#wheel.deltaClient
      ? {
          delta: {
            client: this.#wheel.deltaClient,
            xy: this.#cam.clientToXY(this.#wheel.deltaClient)
          }
        }
      : undefined
    this.#keyboard.postupdate()
    this.#pointer.postupdate()
    this.#wheel.postupdate()
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  /** doesn't consider handled. */
  get wheel(): Readonly<WheelState | undefined> {
    return this.#wheelState
  }

  /** get bits for buttons. */
  #mapBits(btns: Readonly<Chord<Button>>): number {
    let bits = 0
    for (const btn of btns) bits |= this.#bitByButton[btn] ?? 0
    return bits
  }

  /** assign button to bit. */
  #mapButton(btn: Button): number {
    const bit = (this.#bitByButton[btn] ??=
      1 << Object.keys(this.#bitByButton).length)
    this.#buttonByBit[bit] = btn
    return bit
  }
}
