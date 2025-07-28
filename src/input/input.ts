import type {Cam, LevelClientLocalXY} from '../cam.ts'
import type {XY, XYZ} from '../types/geo.ts'
import {ContextMenu} from './context-menu.ts'
import {Gamepad} from './gamepad.ts'
import {Keyboard} from './keyboard.ts'
import type {PointType} from './pointer.ts'
import {Pointer} from './pointer.ts'
import {Wheel} from './wheel.ts'

export type ButtonSet<Button> = [btn: Button, ...Button[]]
export type Combo<Button> = [ButtonSet<Button>, ...ButtonSet<Button>[]]

// biome-ignore format:;
export type DefaultButton =
  | 'L' | 'R' | 'U' | 'D' // dpad.
  | 'A' | 'B' | 'C'       // primary, secondary, tertiary.
  | 'Click' | 'Click2'
  | 'Menu'

export type Point = LevelClientLocalXY & {
  click: LevelClientLocalXY
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
  /** may be negative. */
  pinch: {
    client: XY
    /** level / local. */
    xy: XY
  }
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

export type DefaultInput<Button extends DefaultButton> = Input<Button>

export function DefaultInput<Button extends DefaultButton>(
  cam: Readonly<Cam>,
  target: Element
): DefaultInput<Button> {
  const input = new Input<DefaultButton>(cam, target)
  input.mapKeyboardKey('L', 'ArrowLeft', 'a', 'A')
  input.mapKeyboardKey('R', 'ArrowRight', 'd', 'D')
  input.mapKeyboardKey('U', 'ArrowUp', 'w', 'W')
  input.mapKeyboardKey('D', 'ArrowDown', 's', 'S')
  input.mapKeyboardKey('C', 'c', 'C', 'Shift')
  // to-do: support left shift distinction
  //        https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/location.
  input.mapKeyboardKey('A', 'x', 'X', '.', '>', ' ')
  input.mapKeyboardKey('B', 'z', 'Z', '/', '?')
  input.mapKeyboardKey('Menu', 'Enter', 'Escape')

  // https://w3c.github.io/gamepad/#remapping
  input.mapGamepadAxis('L', 'R', 0, 2)
  input.mapGamepadAxis('U', 'D', 1, 3)
  input.mapGamepadButton('L', 14)
  input.mapGamepadButton('R', 15)
  input.mapGamepadButton('U', 12)
  input.mapGamepadButton('D', 13)
  input.mapGamepadButton('A', 0)
  input.mapGamepadButton('B', 2)
  input.mapGamepadButton('C', 1)
  input.mapGamepadButton('Menu', 9)

  input.mapPointerClick('Click', 1)
  input.mapPointerClick('Click2', 2)
  return input as DefaultInput<Button>
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
 */
export class Input<Button extends string> {
  /** time allowed between combo inputs. */
  comboMaxIntervalMillis: number = 300
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
  minHeldMillis: number = 300
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
  readonly #gamepad: Gamepad = new Gamepad()
  /** time since buttons changed. */
  #heldMillis: number = 0
  readonly #keyboard: Keyboard
  readonly #pointer: Pointer
  #pointerState: PointerState | undefined
  /** bits last update. may not be equal to `#combo.at(-1)`. */
  #prevBits: number = 0
  readonly #target: Element
  readonly #wheel: Wheel
  #wheelState: Readonly<WheelState> = {
    delta: {client: {x: 0, y: 0, z: 0}, xy: {x: 0, y: 0}}
  }

  constructor(cam: Readonly<Cam>, target: Element) {
    this.#cam = cam
    this.#contextMenu = new ContextMenu(target)
    this.#keyboard = new Keyboard(target)
    this.#pointer = new Pointer(target)
    this.#target = target
    this.#wheel = new Wheel(target)
  }

  /** for debugging. */
  get combo(): Button[][] {
    const sets: Button[][] = []
    for (const bits of this.#combo) {
      const set: Button[] = []
      for (let bit = 1; bit <= bits; bit <<= 1) {
        if ((bit & bits) === bit && this.#buttonByBit[bit])
          set.push(this.#buttonByBit[bit]!)
      }
      sets.push(set)
    }
    return sets
  }

  /**
   * enable when game is paused or in photo mode to allow right clicks and long
   * presses to save canvas.
   */
  get contextMenu(): {enable: boolean} {
    return this.#contextMenu
  }

  /** true if input hasn't changed for a while. */
  get held(): boolean {
    return !this.handled && this.#heldMillis >= this.minHeldMillis
  }

  isAnyOn(...btns: Readonly<ButtonSet<Button>>): boolean {
    return !this.handled && !!(this.#bits & this.#mapBits(btns))
  }

  isAnyOnStart(...btns: Readonly<ButtonSet<Button>>): boolean {
    return this.started && this.isAnyOn(...btns)
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
    // entry is pushed. make sure the current entry is the current state and
    // that the last entry's buttons haven't been released.
    return !this.handled && this.#combo.at(-1) === this.#bits
  }

  /** like isComboEndsWith() but test if the last button is triggered. */
  isComboEndsWithStart(...combo: Readonly<Combo<Button>>): boolean {
    // isOnStart() can handled zero-length.
    return this.isOnStart(...combo.at(-1)!) && this.isComboEndsWith(...combo)
  }

  /** like isCombo() but test if the last button is triggered. */
  isComboStart(...combo: Readonly<Combo<Button>>): boolean {
    return this.isOnStart(...combo.at(-1)!) && this.isCombo(...combo)
  }

  /*:
   * true if any button in set is not on. this is usually what's wanted. eg:
   * ```ts
   * if (isOn('A', 'B')) console.log('on')
   * if (isOff('A', 'B')) console.log('not A+B; A and/or B is off')
   * ```
   */
  isOff(...btns: Readonly<ButtonSet<Button>>): boolean {
    return !this.handled && !this.isOn(...btns)
  }

  isOffStart(...btns: Readonly<ButtonSet<Button>>): boolean {
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
  isOn(...btns: Readonly<ButtonSet<Button>>): boolean {
    const bits = this.#mapBits(btns)
    return !this.handled && (this.#bits & bits) === bits
  }

  isOnStart(...btns: Readonly<ButtonSet<Button>>): boolean {
    return this.started && this.isOn(...btns)
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

  /** @arg keys union of case-sensitive KeyboardEvent.key. */
  mapKeyboardKey(btn: Button, ...keys: readonly string[]): void {
    for (const key of keys) this.#keyboard.bitByKey[key] = this.#mapButton(btn)
  }

  mapPointerClick(btn: Button, ...clicks: readonly number[]): void {
    for (const click of clicks)
      this.#pointer.bitByButton[click] = this.#mapButton(btn)
  }

  /** doesn't consider handled. */
  get point(): PointerState | undefined {
    return this.#pointerState
  }

  get pointer(): {dragMinClient: number} {
    return this.#pointer
  }

  register(op: 'add' | 'remove'): this {
    this.#target[`${op}EventListener`]('blur', this.reset) // keyup is lost if window loses focus.
    this.#contextMenu.register(op)
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
    this.#wheelState = {delta: {client: {x: 0, y: 0, z: 0}, xy: {x: 0, y: 0}}}
  }

  /** true if input has changed. */
  get started(): boolean {
    return !this.handled && this.#bits !== this.#prevBits
  }

  /**
   * call on new frame before altering cam. dispatches always occur before an
   * update.
   * @arg millis time since last update.
   */
  update(millis: number): void {
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
      this.#wheel.invalid
    this.gestured ||= !!this.#bits

    if (
      (millis > this.comboMaxIntervalMillis && this.#bits !== this.#prevBits) ||
      (this.#heldMillis + millis > this.comboMaxIntervalMillis && !this.#bits)
    ) {
      this.#combo.length = 0
    }

    if (this.#bits === this.#prevBits) this.#heldMillis += millis
    else this.#heldMillis = millis

    if (this.#bits && this.#bits !== this.#prevBits)
      this.#combo.push(this.#bits)

    if (this.#pointer.primary) {
      const pinchClient = this.#pointer.pinchClient
      const pinchXY = this.#cam.toXY(pinchClient)
      const dragOn =
        this.#pointer.primary.drag &&
        !Object.values(this.#pointer.secondary).length
      const secondary: Point[] = []
      for (const pt of Object.values(this.#pointer.secondary)) {
        secondary.push({
          type: pt.type,
          click: {
            client: pt.clickClient,
            local: this.#cam.toXYLocal(pt.clickClient),
            xy: this.#cam.toXY(pt.clickClient)
          },
          xy: this.#cam.toXY(pt.xyClient),
          client: pt.xyClient,
          local: this.#cam.toXYLocal(pt.xyClient)
        })
      }
      const centerClient = this.#pointer.centerClient!
      const center = {
        client: centerClient,
        local: this.#cam.toXYLocal(centerClient),
        xy: this.#cam.toXY(centerClient)
      }
      this.#pointerState = {
        center,
        click: {
          client: this.#pointer.primary.clickClient,
          local: this.#cam.toXYLocal(this.#pointer.primary.clickClient),
          xy: this.#cam.toXY(this.#pointer.primary.clickClient)
        },
        drag: {
          on: dragOn,
          start: !this.#pointerState?.drag.on && dragOn,
          end: !!this.#pointerState?.drag.on && !dragOn
        },
        pinch: {client: pinchClient, xy: pinchXY},
        secondary,
        type: this.#pointer.primary.type,
        xy: this.#cam.toXY(this.#pointer.primary.xyClient),
        client: this.#pointer.primary.xyClient,
        local: this.#cam.toXYLocal(this.#pointer.primary.xyClient)
      }
    }
    // secondary should never be set when primary isn't.
    else this.#pointerState = undefined

    this.#wheelState = {
      delta: {
        client: this.#wheel.deltaClient,
        xy: this.#cam.toXY(this.#wheel.deltaClient)
      }
    }
    this.#pointer.postupdate()
    this.#wheel.postupdate()
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  /** doesn't consider handled. */
  get wheel(): Readonly<WheelState> {
    return this.#wheelState
  }

  /** get bits for buttons. */
  #mapBits(btns: Readonly<ButtonSet<Button>>): number {
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
