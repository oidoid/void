export type Version = {
  /** Git short hash. */
  hash: string
  /** package.json `published` YYYYMMDD. */
  published: string
  /** package.json semantic `version`. */
  version: string
}

declare namespace globalThis {
  var voidVersion: Version // set by esbuild.
}

export const version: Version = globalThis.voidVersion
