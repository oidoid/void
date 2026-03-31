import type {AnyEvent, OnEvent} from '../event.ts'

// keyboard button physical location codes on a virtual standard keyboard
// irrespective of layout and modifiers hashed to bits. use for game bindings.
// @internal
export const keyByCode: {readonly [k: string]: number} = {
  ArrowUp: 1 << 0,
  KeyW: 1 << 0,
  Numpad8: 1 << 0,

  ArrowDown: 1 << 1,
  KeyS: 1 << 1,
  Numpad2: 1 << 1,

  ArrowLeft: 1 << 2,
  KeyA: 1 << 2,
  Numpad4: 1 << 2,

  ArrowRight: 1 << 3,
  KeyD: 1 << 3,
  Numpad6: 1 << 3,

  // a.
  ShiftLeft: 1 << 4,
  Space: 1 << 4,
  ShiftRight: 1 << 4,

  // b.
  KeyZ: 1 << 5,
  ControlLeft: 1 << 5,
  Slash: 1 << 5,

  // c.
  KeyX: 1 << 6,
  AltLeft: 1 << 6,
  Period: 1 << 6,

  // menu.
  Enter: 1 << 7,

  // back.
  Escape: 1 << 8
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
