import '../index.ts'

declare module '../index.ts' {
  interface Debug {
    /** always render. */
    invalid?: string
    /** update the clock at least once a second instead of once a minute. */
    seconds?: string
  }
}
