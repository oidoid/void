import * as bridge from '../eng/bridge.ts'
import type {AnyEvent, OnEvent} from '../eng/event.ts'

// keyboard button physical location codes on a virtual standard keyboard
// irrespective of layout and modifiers hashed to bits. use for game bindings.
// @internal
export const keyByCode: {readonly [k: string]: number} = {
  ArrowUp: bridge.keyUp,
  KeyW: bridge.keyUp,
  Numpad8: bridge.keyUp,

  ArrowDown: bridge.keyDown,
  KeyS: bridge.keyDown,
  Numpad2: bridge.keyDown,

  ArrowLeft: bridge.keyLeft,
  KeyA: bridge.keyLeft,
  Numpad4: bridge.keyLeft,

  ArrowRight: bridge.keyRight,
  KeyD: bridge.keyRight,
  Numpad6: bridge.keyRight,

  // a.
  ShiftLeft: bridge.keyA,
  Space: bridge.keyA,
  ShiftRight: bridge.keyA,

  // b.
  KeyZ: bridge.keyB,
  ControlLeft: bridge.keyB,
  Slash: bridge.keyB,

  // c.
  KeyX: bridge.keyC,
  AltLeft: bridge.keyC,
  Period: bridge.keyC,

  // menu.
  Enter: bridge.keyMenu,

  // back.
  Escape: bridge.keyBack
}

// to-do: support multiple keyboards distinctly.
export class Keyboard {
  onEvent: OnEvent = () => {}
  readonly #canvas: Element
  readonly #keys: Set<string> = new Set()
  readonly #input: HTMLInputElement

  constructor(canvas: Element) {
    this.#canvas = canvas
    this.#input = canvas.ownerDocument.createElement('input')
    this.#input.autocomplete = 'off'
    this.#input.spellcheck = false
    this.#input.autocorrect = false
    this.#input.autocapitalize = 'none'
    this.#input.name = 'v' // suppress Chromium lint.
    this.#input.style.position = 'absolute'
    this.#input.style.left = '-9999px'
    this.#input.tabIndex = -1
    // to-do: allow selectively enabling keyboard.
    this.#input.inputMode = 'none' // no virtual keyboard on mobile.
    if (!canvas.parentNode) throw Error('canvas has no parent')
    canvas.parentNode.appendChild(this.#input)
  }

  // bitmask of currently pressed keys; see Key constants in Go.
  get keys(): number {
    let keys = 0
    for (const code of this.#keys) keys |= keyByCode[code] ?? 0
    return keys
  }

  postupdate(): void {
    this.#input.value = ''
    this.#input.focus({focusVisible: false, preventScroll: true})
  }

  register(op: 'add' | 'remove'): this {
    for (const ev of ['keydown', 'keyup'])
      this.#input[`${op}EventListener`](ev, this.#onKey as EventListener)
    this.#canvas[`${op}EventListener`](
      'dragover',
      this.#onDragOver as EventListener
    )
    this.#canvas[`${op}EventListener`]('drop', this.#onDrop as EventListener)
    return this
  }

  reset(): void {
    this.#keys.clear()
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  // UTF-8 text accumulated this frame.
  get text(): string {
    return this.#input.value
  }

  #onDragOver = (ev: DragEvent): void => {
    ev.preventDefault()
  }

  #onDrop = (ev: DragEvent): void => {
    ev.preventDefault()
    const text = ev.dataTransfer?.getData('text/plain')
    if (text) {
      this.#input.value += text
      this.onEvent('input-drop')
    }
  }

  #onKey = (ev: KeyboardEvent): void => {
    if (!ev.isTrusted) return
    if (ev.type === 'keydown') this.#keys.add(ev.code)
    else this.#keys.delete(ev.code)
    this.onEvent(`input-${ev.type}` as AnyEvent)
    ev.stopPropagation()
  }
}
