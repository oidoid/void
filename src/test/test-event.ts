type PointerTestEventInit = {
  buttons: number,
  offsetX: number,
  offsetY: number,
  pointerId: number,
  isPrimary: boolean,
  pointerType: 'mouse' | 'pen' | 'touch'
}

export function KeyTestEvent(
  type: 'keydown' | 'keyup',
  init: Partial<Readonly<KeyboardEvent>>
): Event {
  return Object.assign(new Event(type), init)
}

export function PointerTestEvent(
  type: 'pointercancel' | 'pointerdown' | 'pointermove' | 'pointerup',
  init: Partial<Readonly<PointerTestEventInit>>
): Event {
  return Object.assign(
    new Event(type),
    {
      buttons: 0,
      offsetX: 0,
      offsetY: 0,
      pointerId: 1,
      isPrimary: (init.pointerId ?? 1) === 1,
      pointerType: 'mouse'
    } satisfies PointerTestEventInit,
    init
  )
}

export function WheelTestEvent(init: Partial<Readonly<WheelEvent>>): Event {
  return Object.assign(new Event('wheel'), init)
}
