#!/usr/bin/env node
// void.ts [--assets=assets] [--entry=<index.html>] [--out-dir=<.>] [--out-image=<atlas.png>] [--out-json=<atlas.json>] [--watch]
// compiles images into an atlas and bundles an HTML entrypoint.

import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import type {BuildOptions} from 'esbuild'
import esbuild from 'esbuild'
import {JSDOM} from 'jsdom'
import type {Millis} from '../src/index.ts'
import {debounce} from '../src/utils/async-util.ts'
import {Argv} from './argv.ts'
import {parseAtlasJSON} from './atlas-json-parser/atlas-json-parser.ts'

export interface Opts {
  '--assets'?: string | undefined
  '--entry'?: string | undefined
  '--minify'?: '' | undefined
  '--out-dir'?: string | undefined
  '--out-image'?: string | undefined
  '--out-json'?: string | undefined
  // to-do: --single-file.
  /**
   * run development server on http://localhost:1234 and reload on code change.
   */
  '--watch'?: '' | undefined
}

const htmlNamespace: string = 'HTMLPlugin'
const htmlPlugin: esbuild.Plugin = {
  name: htmlNamespace,
  setup(build) {
    build.onResolve({filter: /\.html?$/i}, args => ({
      path: args.path,
      namespace: htmlNamespace
    }))

    build.onLoad({filter: /.*/, namespace: htmlNamespace}, async args => {
      const doc = (await JSDOM.fromFile(args.path)).window.document

      const scripts = doc.querySelectorAll<HTMLScriptElement>(
        "script[type='module'][src$='.ts']"
      )
      for (const script of scripts)
        script.src = script.getAttribute('src')!.replace(/\.ts$/, '.js')

      return {
        contents: `<!doctype html>\n${doc.documentElement.outerHTML}`,
        loader: 'copy',
        watchFiles: [args.path]
      }
    })
  }
}

export async function build(args: readonly string[]): Promise<void> {
  const argv = Argv(args)
  if (
    !argv.opts['--assets'] ||
    !argv.opts['--entry'] ||
    !argv.opts['--out-dir'] ||
    !argv.opts['--out-image'] ||
    !argv.opts['--out-json']
  )
    throw Error('missing opt')
  const minify = '--minify' in argv.opts
  const watch = '--watch' in argv.opts

  const doc = (await JSDOM.fromFile(argv.opts['--entry'])).window.document
  // to-do: it's confusing to have this for some inputs and CLI args for other.
  //        even more confusing to say index.ts for script and preload is
  //        index.js.
  const srcFilenames = [
    ...doc.querySelectorAll<HTMLScriptElement>(
      "script[type='module'][src$='.ts']"
    )
  ].map(el => url.fileURLToPath(el.src))

  const opts: BuildOptions = {
    banner: watch
      ? {
          js: "new EventSource('/esbuild').addEventListener('change', () => location.reload());"
        }
      : {},
    bundle: true,
    entryPoints: [argv.opts['--entry'], ...srcFilenames],
    format: 'esm',
    logLevel: 'info', // print the port and build demarcations.
    metafile: true, // to-do: write meta.
    minify,
    outdir: argv.opts['--out-dir'],
    plugins: [htmlPlugin],
    sourcemap: 'linked',
    target: 'es2024', // https://esbuild.github.io/content-types/#tsconfig-json
    write: !watch
  }

  packAtlas(
    argv.opts['--assets'],
    argv.opts['--out-image'],
    argv.opts['--out-json']
  )
  if (watch) {
    fs.watch(argv.opts['--assets'], {recursive: true}, (ev, type) =>
      onWatch(argv, ev, type)
    )
    const ctx = await esbuild.context(opts)
    await Promise.all([
      ctx.watch(),
      ctx.serve({port: 1234, servedir: argv.opts['--out-dir']})
    ])
  } else await esbuild.build(opts)
}

const onWatch = debounce(
  (argv: Argv, ev: fs.WatchEventType, file: string | null) => {
    console.log(`${file}: ${ev}`)
    packAtlas(
      argv.opts['--assets']!,
      argv.opts['--out-image']!,
      argv.opts['--out-json']!
    )
  },
  500 as Millis
)

export function packAtlas(
  assetsDirname: string,
  outImageFilename: string,
  outJSONFilename: string
): void {
  const aseFilenames = fs
    .readdirSync(assetsDirname, {recursive: true, encoding: 'utf8'})
    .filter(name => name.endsWith('.aseprite'))
    .map(name => path.resolve(assetsDirname, name))
  if (!aseFilenames.length) return

  const json = execFileSync(
    'aseprite',
    [
      '--batch',
      '--color-mode=indexed',
      '--filename-format={title}--{tag}--{frame}',
      '--list-slices',
      '--list-tags',
      '--merge-duplicates',
      `--sheet=${outImageFilename}`,
      '--sheet-pack',
      '--tagname-format={title}--{tag}',
      ...aseFilenames
    ],
    {encoding: 'utf8'}
  )
  fs.writeFileSync(
    outJSONFilename,
    JSON.stringify(parseAtlasJSON(JSON.parse(json)))
  )

  execFileSync('biome', ['check', '--fix', outJSONFilename], {encoding: 'utf8'})
}

if (import.meta.main) build(process.argv)
