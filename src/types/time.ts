declare const millis: unique symbol
export type Millis = number & {readonly [millis]: never}

export function now(): Millis {
  return Date.now() as Millis
}
