#!/usr/bin/env node
// void.ts --config=<void.json> [--minify] [--one-file] [--watch]
// compiles images into an atlas and bundles an HTML entrypoint.

import path from 'node:path'
import packageJSON from '../package.json' with {type: 'json'}
import {parseConfigFile} from '../schema/config-file.ts'
import type {VoidVersion} from '../src/types/void-version.ts'
import {bundle} from './bundle/bundle.ts'
import {Config} from './types/config.ts'
import {Argv} from './utils/argv.ts'
import {exec} from './utils/exec.ts'
import {parseHTML} from './utils/html-parser.ts'

declare module './utils/argv.ts' {
  interface Opts {
    '--config'?: string
    '--minify'?: true
    /** inline everything into a single HTML file output. */
    '--one-file'?: true
    /**
     * run development server on http://localhost:1234 and reload on code
     * change.
     */
    '--watch'?: true
  }
}

export async function build(
  args: readonly string[],
  env: {readonly [name: string]: string | undefined}
): Promise<void> {
  const argv = Argv(args)
  const configFile = await parseConfigFile(argv.opts['--config'] ?? 'void.json')
  const config = Config(configFile, argv, env.npm_package_version)

  const doc = await parseHTML(config.entry)
  const srcFilenames = [
    ...doc.querySelectorAll<HTMLScriptElement>(
      "script[type='module'][src$='.ts']"
    )
  ].map(el => path.resolve(path.dirname(config.entry), el.getAttribute('src')!))

  const voidVersion: VoidVersion = {
    hash: (await exec('git', 'rev-parse', '--short', 'HEAD')).trim(),
    published: packageJSON.published,
    // imported JSON doesn't treeshake. define as a constant.
    version: packageJSON.version
  }

  await bundle(config, srcFilenames, voidVersion)
}

if (import.meta.main) await build(process.argv, process.env)
