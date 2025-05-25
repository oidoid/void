import type { Cam } from '../cam.ts'
import { type XY, type XYZ } from '../types/geo.ts'
import { ContextMenu } from './context-menu.ts'
import { Gamepad } from './gamepad.ts'
import { Keyboard } from './keyboard.ts'
import { Pointer } from './pointer.ts'
import { Wheel } from './wheel.ts'
import type { PointType } from './pointer.ts'

export type ButtonSet<Button> = [btn: Button, ...Button[]]
export type Combo<Button> = [ButtonSet<Button>, ...ButtonSet<Button>[]]

// to-do: camelCase enums vs Pascal. camel is nice in json
export type DefaultButton = // deno-fmt-ignore
  | 'L' | 'R' | 'U' | 'D' // dpad.
  | 'A' | 'B' | 'C' // primary, secondary, tertiary.
  | 'Click' | 'Click2'
  | 'Menu'

export type Point = {
  type: PointType | undefined,
  /** event position relative canvas top-left (in DPI scale). */
  xyClient: XY,
  /**
   * position relative canvas top-left in level scale (like level xy but no cam
   * offset) within cam reevaluated each frame.
   */
  xyLocal: XY,
  /** level position within cam reevaluated each frame. */
  xy: XY
}

/** doesn't consider handled. */
type PointerState = Point & {
  centerClient: XY | undefined,
  /** false when pinched. */
  drag: boolean, // should work with super patience by having adjustable threshold to 0 or maybe 1px. be nice if it could be reset with a check against whether or not hte box is even draggable. like setdragarea, or set draggable.
  dragStart: boolean,
  dragEnd: boolean,
  /** nonnegative. */
  pinchClient: number,
  /** secondary points. */
  secondary: Point[]
}

type WheelState = {
  /** level / local delta. no difference. */
  delta: XY,
  deltaClient: Readonly<XYZ>
}

export type DefaultInput<Button extends DefaultButton = DefaultButton> = Input<
  Button
>

export function DefaultInput<Button extends DefaultButton>(
  cam: Readonly<Cam>,
  target: EventTarget
): DefaultInput<Button> {
  const input = new Input<DefaultButton>(cam, target)
  input.mapKeyboardKey('L', 'ArrowLeft', 'a', 'A')
  input.mapKeyboardKey('R', 'ArrowRight', 'd', 'D')
  input.mapKeyboardKey('U', 'ArrowUp', 'w', 'W')
  input.mapKeyboardKey('D', 'ArrowDown', 's', 'S')
  input.mapKeyboardKey('A', 'c', 'C', ' ')
  input.mapKeyboardKey('B', 'x', 'X')
  input.mapKeyboardKey('C', 'z', 'Z')
  input.mapKeyboardKey('Menu', 'Enter', 'Escape')

  // https://w3c.github.io/gamepad/#remapping
  input.mapGamepadAxis('L', 'R', 0, 2)
  input.mapGamepadAxis('U', 'D', 1, 3)
  input.mapGamepadButton('L', 14)
  input.mapGamepadButton('R', 15)
  input.mapGamepadButton('U', 12)
  input.mapGamepadButton('D', 13)
  input.mapGamepadButton('A', 0)
  input.mapGamepadButton('Menu', 9)

  input.mapPointerClick('Click', 1)
  input.mapPointerClick('Click2', 2)
  return input as DefaultInput<Button>
}

// asdsa
// asdsa
// asdsa
// asdsa
// asdsa
// asdsa
// asdsa
// asdsa
// asdsa
// asdsa
// asdsa
// asdsa
// devices just serve state up through update, not post update. so no cahce. input is responsible for making copies.
// no control over specific devices and no two player support. just one big
// aggregate. could do multiplayer if devices were asked for instead of searched
// for.
// no ability to see analog state of gamepad which seems fixable like point if I expose an axis or better return direction as a number instead of bool
/** input device abstraction. aggregates history and merges devices. devices
 * can only tell you about current state not history or coordinate with other devices.
 * if you miss a device event, you miss it. that's the nature of polling. */
export class Input<Button extends string> {
  /** clear input for rest of frame. */
  handled: boolean = false
  /**
   * minimum duration for an input to be considered held. durations are
   * calculated at frame boundaries, not on actual press. devices are treated
   * strictly as polled aggregates.
   */
  minHeldMillis: number = 300
  /** time allowed between combo inputs. */
  maxIntervalMillis: number = 300

  readonly #bitByButton: { [btn in Button]?: number } = {}
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
  #gestured: boolean = false
  /** time since buttons changed. */
  #heldMillis: number = 0
  readonly #keyboard: Keyboard
  readonly #pointer: Pointer
  #pointerState: PointerState | undefined
  /** bits last update. may not be equal to `#combo.at(-1)`. */
  #prevBits: number = 0
  /** millis last update. necessary to allow the current frame to test start. */
  // #prevUpdateMillis: number = 0
  readonly #target: EventTarget
  readonly #wheel: Wheel
  #wheelState: Readonly<WheelState> = {
    deltaClient: {x: 0, y: 0, z: 0},
    delta: {x: 0, y: 0}
  }

  constructor(cam: Readonly<Cam>, target: EventTarget) {
    this.#cam = cam
    this.#contextMenu = new ContextMenu(target)
    this.#keyboard = new Keyboard(target)
    this.#pointer = new Pointer(target)
    this.#target = target
    this.#wheel = new Wheel(target)
  }

  get combo(): Button[][] {
    const sets = []
    for (const bits of this.#combo) {
      const set = []
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

  /**
   * true if any button, key, or click was _ever_ on. doesn't consider handled.
   */
  get gestured(): boolean {
    return this.#gestured
  }

  isAnyOn(...btns: Readonly<ButtonSet<Button>>): boolean {
    return !this.handled && !!(this.#bits & this.#mapBits(btns))
  }

  isAnyOnStart(...btns: Readonly<ButtonSet<Button>>): boolean {
    return this.isStart() && this.isAnyOn(...btns)
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
    // #combo is a historical record of buttons. Whenever buttons changes, a new
    // entry is pushed. make sure the current entry is the current state and
    // that the last entry's buttons haven't been released.
    return !this.handled && this.#combo.at(-1) === this.#bits
  }

  /** like isComboEndsWith() but test if the last button is triggered. */
  isComboEndsWithStart(...combo: Readonly<Combo<Button>>): boolean {
    return this.isOnStart(...combo.at(-1) ?? [] as unknown as ButtonSet<Button>)
      && this.isComboEndsWith(...combo)
  }

  /** like isCombo() but test if the last button is triggered. */
  isComboStart(...combo: Readonly<Combo<Button>>): boolean {
    return this.isOnStart(...combo.at(-1) ?? [] as unknown as ButtonSet<Button>)
      && this.isCombo(...combo)
  }

  /** true if input hasn't changed for a while. */
  isHeld(): boolean {
    return !this.handled && this.#heldMillis >= this.minHeldMillis
  }

  isOff(...btns: Readonly<ButtonSet<Button>>): boolean {
    return !this.handled && !this.isOn(...btns)
  }

  isOffStart(...btns: Readonly<ButtonSet<Button>>): boolean {
    const bits = this.#mapBits(btns)
    const wasOn = (this.#prevBits & bits) === bits
    // don't test !this.#bits since it might forever miss the off event.
    return wasOn && this.isStart() && this.isOff(...btns)
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
    return this.isStart() && this.isOn(...btns)
  }

  /** true if input has changed. */
  isStart(): boolean {
    return !this.handled && this.#bits !== this.#prevBits
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
    const fn = this.#target[`${op}EventListener`].bind(this.#target)
    fn('blur', this.reset) // keyup is lost if window loses focus.
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
    this.#gamepad.reset()
    this.#keyboard.reset()
    this.#pointer.reset()
    this.#wheel.reset()
    // asdsad
    // asdsad
    // asdsad
    // asdsad
    // asdsad
    // asdsad
    // asdsad
    // asdsad
    // asdsad
    // asdsad
    // asdsad
    // asdsad
    // asdsad
    // this.#pointerState.drag = false
    // this.#pointerState.dragEnd = false
    // this.#pointerState.dragStart = false
    // to-do: rest of pointstate
    this.#wheelState = {deltaClient: {x: 0, y: 0, z: 0}, delta: {x: 0, y: 0}}
  }

  /**
   * call on new frame before altering cam. dispatches always occur before an
   * update.
   * @arg millis time since last update.
   */
  update(millis: number) {
    this.handled = false
    this.#gamepad.update()

    this.#prevBits = this.#bits
    this.#bits = this.#gamepad.bits | this.#keyboard.bits
      | (this.#pointer.primary?.bits ?? 0)
    this.#gestured ||= !!this.#bits

    if (
      millis > this.maxIntervalMillis && this.#bits !== this.#prevBits
      || (this.#heldMillis + millis) > this.maxIntervalMillis && !this.#bits
    ) { this.#combo.length = 0 }

    if (this.#bits === this.#prevBits) this.#heldMillis += millis
    else this.#heldMillis = millis

    if (this.#bits && this.#bits !== this.#prevBits)
      this.#combo.push(this.#bits)

    // let's just start with xyClient and get that working end to end
    if (this.#pointer.primary) {
      const pinchClient = this.#pointer.pinchClient
      const drag = this.#pointer.primary.drag && !pinchClient
      const secondary = this.#pointer.secondary.map((pt) => ({
        type: pt.type,
        xy: this.#cam.toXY(pt.xyClient),
        xyClient: pt.xyClient,
        xyLocal: this.#cam.toXYLocal(pt.xyClient)
      }))
      this.#pointerState = {
        centerClient: this.#pointer.centerClient,
        drag,
        dragStart: !this.#pointerState?.drag && drag,
        dragEnd: !!this.#pointerState?.drag && !drag,
        pinchClient,
        secondary,
        type: this.#pointer.primary.type,
        xy: this.#cam.toXY(this.#pointer.primary.xyClient),
        xyClient: this.#pointer.primary.xyClient,
        xyLocal: this.#cam.toXYLocal(this.#pointer.primary.xyClient)
      }
    }
    else {
      // secondary should never be set when primary isn't.
      this.#pointerState = undefined
    }

    this.#wheelState = {
      deltaClient: this.#wheel.deltaClient,
      delta: this.#cam.toXY(this.#wheel.deltaClient)
    }
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
    const bit = this.#bitByButton[btn] ??= 1
      << Object.keys(this.#bitByButton).length
    this.#buttonByBit[bit] = btn
    return bit
  }
}
