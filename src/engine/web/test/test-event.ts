export type PointerTestEventInit = {
  buttons: number
  ctrlKey: boolean
  isPrimary: boolean
  isTrusted: boolean
  movementX: number
  movementY: number
  offsetX: number
  offsetY: number
  pointerId: number
  pointerType: 'mouse' | 'pen' | 'touch'
}

export function TestEvent(type: string, isTrusted: boolean = true): Event {
  return Object.defineProperty(new Event(type), 'isTrusted', { value: isTrusted, writable: true })
}

export function KeyTestEvent(
  type: 'keydown' | 'keyup',
  init: Partial<Readonly<KeyboardEvent>>
): Event {
  return Object.assign(TestEvent(type), init)
}

export function MenuTestEvent(
  type: string,
  init: Partial<Readonly<PointerEvent>>
): Event {
  return Object.assign(TestEvent(type), init)
}

export function PointerTestEvent(
  type: 'pointercancel' | 'pointerdown' | 'pointermove' | 'pointerup',
  init: Partial<Readonly<PointerTestEventInit>>
): Event
export function PointerTestEvent(type: 'pointerenter' | 'pointerleave'): Event
export function PointerTestEvent(
  type:
    | 'pointercancel'
    | 'pointerdown'
    | 'pointermove'
    | 'pointerup'
    | 'pointerenter'
    | 'pointerleave',
  init?: Partial<Readonly<PointerTestEventInit>>
): Event {
  return Object.assign(
    TestEvent(type),
    {
      buttons: 0,
      ctrlKey: false,
      isPrimary: (init?.pointerId ?? 1) === 1,
      isTrusted: true,
      movementX: 0,
      movementY: 0,
      offsetX: 0,
      offsetY: 0,
      pointerId: 1,
      pointerType: 'mouse',
    } satisfies PointerTestEventInit,
    init
  )
}

export function WheelTestEvent(init: Partial<Readonly<WheelEvent>>): Event {
  return Object.assign(TestEvent('wheel'), init)
}
