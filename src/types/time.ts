declare global {
  interface DateConstructor {
    now(): UTCMillis
  }

  interface Performance {
    now(): OriginMillis
  }
}

declare const millis: unique symbol
/** duration in milliseconds. */
export type Millis = number & {readonly [millis]: never}

declare const originMillis: unique symbol
/** milliseconds relative `performance.timeOrigin`. */
export type OriginMillis = number & {readonly [originMillis]: never}

declare const utcMillis: unique symbol
export type UTCMillis = number & {readonly [utcMillis]: never}
