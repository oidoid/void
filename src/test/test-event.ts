export type PointerTestEventInit = {
  buttons: number
  offsetX: number
  offsetY: number
  movementX: number
  movementY: number
  pointerId: number
  isPrimary: boolean
  pointerType: 'mouse' | 'pen' | 'touch'
  ctrlKey: boolean
}

export function TestEvent(type: string): Event {
  return Object.defineProperty(new Event(type), 'isTrusted', {value: true})
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
): Event {
  return Object.assign(
    TestEvent(type),
    {
      buttons: 0,
      offsetX: 0,
      offsetY: 0,
      movementX: 0,
      movementY: 0,
      pointerId: 1,
      isPrimary: (init.pointerId ?? 1) === 1,
      pointerType: 'mouse',
      ctrlKey: false
    } satisfies PointerTestEventInit,
    init
  )
}

export function WheelTestEvent(init: Partial<Readonly<WheelEvent>>): Event {
  return Object.assign(TestEvent('wheel'), init)
}
