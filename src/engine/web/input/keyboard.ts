import type {AnyEvent, OnEvent} from '../event.ts'

// keyboard button physical location codes on a virtual standard keyboard
// irrespective of layout and modifiers hashed to bits. use for game bindings.
const keyByCode: {readonly [k: string]: number} = {
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

  // b.
  KeyZ: 1 << 5,
  ControlLeft: 1 << 5,

  // c.
  KeyX: 1 << 6,
  AltLeft: 1 << 6,

  // start.
  Enter: 1 << 7,

  // select.
  Escape: 1 << 8,
  ShiftRight: 1 << 8
}

export class Keyboard {
  onEvent: OnEvent = () => {}
  readonly #keys: Set<string> = new Set()
  readonly #input: HTMLInputElement

  constructor(canvas: Element) {
    this.#input = document.createElement('input')
    this.#input.autocomplete = 'off'
    this.#input.spellcheck = false
    this.#input.setAttribute('autocorrect', 'off')
    this.#input.setAttribute('autocapitalize', 'none')
    this.#input.style.position = 'absolute'
    this.#input.style.left = '-9999px'
    this.#input.style.opacity = '0'
    if (!canvas.parentNode) throw Error('canvas has no parent')
    canvas.parentNode.appendChild(this.#input)
  }

  get keys(): number {
    let bits = 0
    for (const code of this.#keys) bits |= keyByCode[code] ?? 0
    return bits
  }

  postupdate(): void {
    this.#input.value = ''
    this.#input.focus({focusVisible: false, preventScroll: true})
  }

  register(op: 'add' | 'remove'): void {
    for (const ev of ['keydown', 'keyup'])
      this.#input[`${op}EventListener`](ev, this.#onKey as EventListener)
  }

  reset(): void {
    this.#keys.clear()
  }

  get text(): string {
    return this.#input.value
  }

  #onKey = (ev: KeyboardEvent): void => {
    if (ev.type === 'keydown') this.#keys.add(ev.code)
    else this.#keys.delete(ev.code)
    this.onEvent(`input-${ev.type}` as AnyEvent)
    ev.stopPropagation()
  }
}
