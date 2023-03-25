export interface GlobalEventPub
  extends Pick<typeof globalThis, 'addEventListener' | 'removeEventListener'> {}
