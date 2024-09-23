#!/usr/bin/env -S node --experimental-strip-types --no-warnings=ExperimentalWarning
// bundles sources into a single HTML file for distribution and development.
//
// void [--watch] assets.json
// --watch  run development server. serve on http://localhost:1234 and reload on
//          code change.

import {type ExecFileException, execFile} from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import esbuild from 'esbuild'
import type {BuildOptions, BuildResult} from 'esbuild'
import {JSDOM} from 'jsdom'
import pkg from '../package.json' with {type: 'json'}
import type {Config} from '../src/types/config.js'
import {parseAtlas} from './atlas-parser.ts'
import {parseTileset} from './tileset-parser.ts'

const watch = process.argv.includes('--watch')
const configFilename =
  process.argv.slice(2).filter(arg => !arg.startsWith('--'))[0] ?? '/dev/null'
const config: Config = JSON.parse(await fs.readFile(configFilename, 'utf8'))

if (!config.atlas) throw Error('no atlas input')
if (!config.html) throw Error('no HTML input')
if (!config.out) throw Error('no output directory')
if (!config.tags) throw Error('no tags')

const configDir = path.dirname(configFilename)

const htmlInFilename = path.resolve(configDir, config.html)
const htmlInDir = path.dirname(htmlInFilename)

const doc = new JSDOM(await fs.readFile(htmlInFilename, 'utf8')).window.document
let srcFilename = doc.querySelector<HTMLScriptElement>(
  'script[type="module"][src]'
)?.src
if (!srcFilename) throw Error('no script source')
srcFilename = path.resolve(htmlInDir, srcFilename)

const outDir = path.resolve(configDir, config.out)

const atlasDir = path.resolve(configDir, config.atlas)
const atlasFilenames = (await fs.readdir(atlasDir))
  .filter(name => name.endsWith('.aseprite'))
  .map(name => path.resolve(atlasDir, name))
const atlasImageFilename = `${await fs.mkdtemp('/tmp/', {
  encoding: 'utf8'
})}/atlas.png`
const atlasAse = await ase(
  '--batch',
  '--color-mode=indexed',
  '--filename-format={title}--{tag}--{frame}',
  // '--ignore-empty', breaks --tagname-format.
  '--list-slices',
  '--list-tags',
  '--merge-duplicates',
  `--sheet=${atlasImageFilename}`,
  '--sheet-pack',
  '--tagname-format={title}--{tag}',
  ...atlasFilenames
)
const atlas = JSON.stringify(parseAtlas(JSON.parse(atlasAse), config.tags))
const atlasImage = await fs.readFile(atlasImageFilename)
const atlasURI = `data:image/png;base64,${atlasImage.toString('base64')}`

let tileset = 'null'
let tilesetURI = ''
if (config.tileset) {
  if (!config.tiles) throw Error('no tiles')
  const tmp = await fs.mkdtemp('/tmp/', {encoding: 'utf8'})
  const tilesetImageFilename = `${tmp}/tileset.png`
  const tilesetAse = await ase(
    '--batch',
    '--color-mode=indexed',
    '--list-slices',
    `--sheet=${tilesetImageFilename}`,
    path.resolve(configDir, config.tileset)
  )
  tileset = JSON.stringify(parseTileset(JSON.parse(tilesetAse), config.tiles))
  tilesetURI = `data:image/png;base64,${(await fs.readFile(tilesetImageFilename)).toString('base64')}`
}

async function pluginOnEnd(result: BuildResult): Promise<void> {
  const copy = doc.cloneNode(true) as Document
  const manifestEl = copy.querySelector<HTMLLinkElement>(
    'link[href][rel="manifest"]'
  )
  let manifestFilename
  if (manifestEl) {
    manifestFilename = path.resolve(htmlInDir, manifestEl.href)
    const manifest = JSON.parse(await fs.readFile(manifestFilename, 'utf8'))
    for (const icon of manifest.icons) {
      if (!icon.src) throw Error('no manifest icon src')
      if (!icon.type) throw Error('no manifest icon type')
      const file = await fs.readFile(
        `${path.dirname(manifestFilename)}/${icon.src}`
      )
      icon.src = `data:${icon.type};base64,${file.toString('base64')}`
    }
    if (watch) manifest.start_url = 'http://localhost:1234'
    manifest.version = pkg.version
    manifestEl.href = `data:application/json,${encodeURIComponent(
      JSON.stringify(manifest)
    )}`
  }
  const iconEl = copy.querySelector<HTMLLinkElement>(
    'link[href][rel="icon"][type]'
  )
  if (iconEl) {
    const file = await fs.readFile(
      path.resolve(path.dirname(manifestFilename ?? ''), iconEl.href)
    )
    iconEl.href = `data:${iconEl.type};base64,${file.toString('base64')}`
  }

  let js = ''
  if (watch)
    js +=
      "new globalThis.EventSource('/esbuild').addEventListener('change', () => globalThis.location.reload());"

  const outFiles =
    result.outputFiles?.filter(file => file.path.endsWith('.js')) ?? []
  if (outFiles.length > 1) throw Error('cannot concatenate JavaScript files')
  js += outFiles[0]?.text ?? ''

  const scriptEl = copy.querySelector<HTMLScriptElement>(
    'script[type="module"][src]'
  )
  if (!scriptEl) throw Error('no script')
  scriptEl.removeAttribute('src')
  scriptEl.textContent = js
  const outFilename = `${outDir}/${
    watch ? 'index' : `${path.basename(config.html, '.html')}-v${pkg.version}`
  }.html`
  await fs.mkdir(path.dirname(outFilename), {recursive: true})
  await fs.writeFile(
    outFilename,
    `<!doctype html>${copy.documentElement.outerHTML}`
  )
}

const buildOpts: BuildOptions = {
  bundle: true,
  define: {
    'assets.atlas': atlas,
    'assets.atlasURI': `'${atlasURI}'`,
    'assets.tileset': tileset,
    'assets.tilesetURI': `'${tilesetURI}'`
  },
  entryPoints: [srcFilename],
  format: 'esm',
  logLevel: 'info', // print the port and build demarcations.
  minify: !watch,
  outdir: outDir,
  plugins: [{name: 'void', setup: build => build.onEnd(pluginOnEnd)}],
  sourcemap: 'linked',
  target: 'es2022', // https://esbuild.github.io/content-types/#tsconfig-json
  write: false // written by plugin.
}
if (watch) {
  const ctx = await esbuild.context(buildOpts)
  await Promise.race([ctx.watch(), ctx.serve({port: 1234, servedir: 'dist'})])
} else await esbuild.build(buildOpts)

async function ase(...args: readonly string[]): Promise<string> {
  const [err, stdout, stderr] = await new Promise<
    [ExecFileException | null, string, string]
  >(resolve =>
    execFile('aseprite', args, (err, stdout, stderr) =>
      resolve([err, stdout, stderr])
    )
  )
  process.stderr.write(stderr)
  if (err) throw err
  return stdout
}
