export type Bundle = {
  /** Git short hash at build time. do not use if builds are committed. */
  hash: string | undefined
  /** package.json `published` YYYYMMDD. */
  published: string | undefined
  /** package.json semantic `version`. */
  version: string | undefined
}

declare namespace globalThis {
  // imported JSON doesn't treeshake. define as a constant with esbuild.
  const bundle: Bundle
}

export const bundle: Readonly<Bundle> = globalThis.bundle
