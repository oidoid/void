export type VoidVersion = {
  /** package.json `published` YYYYMMDD. */
  published: string
  /** package.json semantic `version`. */
  version: string
}

declare namespace globalThis {
  var voidVersion: VoidVersion // set by esbuild.
}

export const voidVersion: VoidVersion = globalThis.voidVersion
