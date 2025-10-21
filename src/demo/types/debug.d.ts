import '../../index.ts'

declare module '../../index.ts' {
  interface Debug {
    /** update the clock at least once a second instead of once a minute. */
    seconds?: string
  }
}
