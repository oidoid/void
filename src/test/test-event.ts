export function KeyTestEvent(
  type: 'keydown' | 'keyup',
  init: Partial<KeyboardEvent>
): Event {
  return Object.assign(new Event(type), init)
}

export function PointerTestEvent(
  type: 'pointercancel' | 'pointerdown' | 'pointermove' | 'pointerup',
  init: Partial<PointerEvent>
): Event {
  return Object.assign(new Event(type), init)
}

export function WheelTestEvent(init: Partial<WheelEvent>): Event {
  return Object.assign(new Event('wheel'), init)
}
