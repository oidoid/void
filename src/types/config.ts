/** build config. */
export type Config = {
  /** atlas Aseprite directory. */
  readonly atlas: string
  /** HTML template input. */
  readonly html: string
  /** output directory. */
  readonly out: string
  /** atlas tags. */
  readonly tags: {readonly [tag: string]: null}
  /** tileset tiles. */
  readonly tiles: {readonly [tile: string]: null}
  /** tileset Aseprite file. */
  readonly tileset: string
}
