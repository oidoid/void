#!/usr/bin/env node

// void.ts --config=<void.json> [--minify] [--one-file] [--watch]
// compiles images into an atlas and bundles an HTML entrypoint.

import url from 'node:url'
import packageJSON from '../package.json' with {type: 'json'}
import {parseConfigFile} from '../schema/config-file.ts'
import type {Version} from '../src/types/version.ts'
import {bundle} from './bundle/bundle.ts'
import {Argv} from './utils/argv.ts'
import {exec} from './utils/exec.ts'
import {parseHTML} from './utils/html-parser.ts'

declare module './utils/argv.ts' {
  interface Opts {
    '--config'?: string
    '--minify'?: true
    /** inline everything into a single HTML file output. the usual artifacts are still generated but are not necessary. */
    '--one-file'?: true
    /**
     * run development server on http://localhost:1234 and reload on code
     * change.
     */
    '--watch'?: true
  }
}

export async function build(args: readonly string[]): Promise<void> {
  const argv = Argv(args)
  const config = await parseConfigFile(argv.opts['--config'] ?? 'void.json')

  const doc = await parseHTML(config.entry)
  const srcFilenames = [
    ...doc.querySelectorAll<HTMLScriptElement>(
      "script[type='module'][src$='.ts']"
    )
  ].map(el => url.fileURLToPath(el.src))

  const version: Version = {
    hash: (await exec('git', 'rev-parse', '--short', 'HEAD')).trim(),
    published: packageJSON.published,
    // imported JSON doesn't treeshake. define as a constant.
    version: packageJSON.version
  }

  await bundle(argv, config, srcFilenames, version)
}

if (import.meta.main) await build(process.argv)
