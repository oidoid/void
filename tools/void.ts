#!/usr/bin/env node
// void.ts --config=<void.json> [--minify] [--one-file] [--watch]
// compiles images into an atlas and bundles an HTML entrypoint.

import path from 'node:path'
import {bundle} from './bundle/bundle.ts'
import {readConfig} from './types/config.ts'
import {parseHTML} from './utils/html-parser.ts'

declare module './utils/argv.ts' {
  interface Opts {
    '--config'?: string
    '--minify'?: true
    /** inline everything into a single HTML file output. */
    '--one-file'?: true
    /**
     * tsconfig pathname relative config directory. defaults to
     * `tsconfig.json`.
     */
    '--tsconfig'?: string
    /**
     * run development server on http://localhost:1234 and reload on code
     * change.
     */
    '--watch'?: true
  }
}

export async function build(args: readonly string[]): Promise<void> {
  const config = await readConfig(args)

  const doc = await parseHTML(config.entry)
  const srcFilenames = [
    ...doc.querySelectorAll<HTMLScriptElement>(
      "script[type='module'][src$='.ts']"
    )
  ].map(el => path.resolve(path.dirname(config.entry), el.getAttribute('src')!))

  await bundle(config, srcFilenames)
}

if (import.meta.main) await build(process.argv)
