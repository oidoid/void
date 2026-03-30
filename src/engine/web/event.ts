export type AnyEvent =
  | 'input-drop'
  | 'input-gamepad'
  | 'input-keydown'
  | 'input-keyup'
  | 'input-pointercancel'
  | 'input-pointerdown'
  | 'input-pointermove'
  | 'input-pointerup'
  | 'input-wheel'
export type OnEvent = (ev: AnyEvent) => void
