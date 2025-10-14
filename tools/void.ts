#!/usr/bin/env node
// void.ts --config=<void.json> [--minify] [--watch]
// compiles images into an atlas and bundles an HTML entrypoint.

import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import type {BuildOptions} from 'esbuild'
import esbuild from 'esbuild'
import {JSDOM} from 'jsdom'
import {type ConfigFile, parseConfigFile} from '../schema/config-file.ts'
import type {Millis} from '../src/types/time.ts'
import {debounce} from '../src/utils/async-util.ts'
import {Argv} from './argv.ts'
import {parseAtlasJSON} from './atlas-json-parser/atlas-json-parser.ts'

declare module './argv.ts' {
  interface Opts {
    '--config'?: string | undefined
    '--minify'?: '' | undefined
    // to-do: --single-file.
    /**
     * run development server on http://localhost:1234 and reload on code
     * change.
     */
    '--watch'?: '' | undefined
  }
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
  const config = parseConfigFile(argv.opts['--config'] ?? 'void.json')

  const minify = '--minify' in argv.opts
  const watch = '--watch' in argv.opts

  let doc
  try {
    doc = (await JSDOM.fromFile(config.entry)).window.document
  } catch (err) {
    throw Error(`entry ${config.entry} unparsable`, {cause: err})
  }

  // to-do: it's confusing to have this for some inputs and CLI args for other.
  //        even more confusing to say index.ts for script and preload is
  //        index.js. how does this shape up with single-file?
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
    entryPoints: [config.entry, ...srcFilenames],
    format: 'esm',
    logLevel: 'info', // print the port and build demarcations.
    metafile: true,
    minify,
    outdir: config.out,
    plugins: [htmlPlugin],
    sourcemap: 'linked',
    target: 'es2024', // https://esbuild.github.io/content-types/#tsconfig-json
    write: !watch
  }

  packAtlas(config.atlas.assets, config.atlas.image, config.atlas.json)
  if (watch) {
    fs.watch(config.atlas.assets, {recursive: true}, (ev, type) =>
      onWatch(config, ev, type)
    )
    const ctx = await esbuild.context(opts)
    await Promise.all([
      ctx.watch(),
      ctx.serve({port: 1234, servedir: config.out})
    ])
  } else {
    const build = await esbuild.build(opts)
    if (config.meta)
      fs.writeFileSync(config.meta, JSON.stringify(build.metafile))
  }
}

const onWatch = debounce(
  (
    config: Readonly<ConfigFile>,
    ev: fs.WatchEventType,
    file: string | null
  ) => {
    console.log(`${file}: ${ev}`)
    packAtlas(config.atlas.assets, config.atlas.image, config.atlas.json)
  },
  500 as Millis
)

export function packAtlas(
  assetsDirname: string,
  outImageFilename: string,
  outJSONFilename: string
): void {
  let aseFilenames
  try {
    aseFilenames = fs.globSync(path.join(assetsDirname, '**.aseprite'))
  } catch (err) {
    throw Error(`assets dir ${assetsDirname} unreadable`, {cause: err})
  }
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
