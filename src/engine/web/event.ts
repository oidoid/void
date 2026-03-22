export type AnyEvent = 'input-pointercancel' |
  'input-pointerdown' | 'input-pointermove' | 'input-pointerup' | 'input-wheel'
export type OnEvent = (ev: AnyEvent) => void

