export type Config = {
  /** Atlas Aseprite directory. */
  readonly atlas: string
  /** HTML template input. */
  readonly html: string
  /** Output directory. */
  readonly out: string
  /** Atlas tags. */
  readonly tags: {readonly [tag: string]: null}
}
