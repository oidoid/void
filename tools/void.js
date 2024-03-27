#!/usr/bin/env -S node --no-warnings
// Bundles sources into a single HTML file for distribution and development.
//
// void --html=file --out=dir [--watch] sprite...
// --watch  Run development server. Serve on http://localhost:1234 and reload on
//          code change.
//
// --no-warnings shebang works around JSON import warnings. See
// https://github.com/nodejs/node/issues/27355 and
// https://github.com/nodejs/node/issues/40940.

import {execFile} from 'child_process'
import esbuild from 'esbuild'
import {JSDOM} from 'jsdom'
import fs from 'node:fs/promises'
import path from 'node:path'
import pkg from '../package.json' assert {type: 'json'}
import {parseAtlas} from '../src/atlas/atlas-parser.js'

const args = process.argv.filter(arg => !arg.startsWith('--'))
const opts = Object.fromEntries(
  process.argv.filter(arg => arg.startsWith('--')).map(arg => arg.split('='))
)

const watch = '--watch' in opts
const inFilename = opts['--html']
if (!inFilename) throw Error('missing input')
const outDir = opts['--out']
if (!outDir) throw Error('missing output')
const doc = new JSDOM(await fs.readFile(inFilename, 'utf8')).window.document
let srcFilename = /** @type {HTMLScriptElement|null} */ (
  doc.querySelector('script[type="module"][src]')
)?.src
if (!srcFilename) throw Error('missing script source')
srcFilename = `${path.dirname(inFilename)}/${srcFilename}`
const sprites = args.splice(2)
if (!sprites.length) throw Error('missing sprites')

const atlasPNGFilename = `${await fs.mkdtemp('/tmp/', {encoding: 'utf8'})}/atlas.png`
const [err, stdout, stderr] = await new Promise(resolve =>
  execFile(
    'aseprite',
    [
      '--batch',
      '--color-mode=indexed',
      '--filename-format={title}--{tag}--{frame}',
      // '--ignore-empty', Breaks --tagname-format.
      '--list-slices',
      '--list-tags',
      '--merge-duplicates',
      `--sheet=${atlasPNGFilename}`,
      '--sheet-pack',
      '--tagname-format={title}--{tag}',
      ...sprites
    ],
    (err, stdout, stderr) => resolve([err, stdout, stderr])
  )
)
process.stderr.write(stderr)
if (err) throw err

const atlasJSON = JSON.stringify(parseAtlas(JSON.parse(stdout)))
const atlasURI =
  await `data:image/png;base64,${(await fs.readFile(atlasPNGFilename)).toString('base64')}`

/** @type {Parameters<esbuild.PluginBuild['onEnd']>[0]} */
async function pluginOnEnd(result) {
  const copy = /** @type {Document} */ (doc.cloneNode(true))
  const manifestEl = /** @type {HTMLLinkElement|null} */ (
    copy.querySelector('link[href][rel="manifest"]')
  )
  if (manifestEl) {
    const manifestFilename = `${path.dirname(inFilename)}/${manifestEl.href}`
    const manifest = JSON.parse(await fs.readFile(manifestFilename, 'utf8'))
    for (const icon of manifest.icons) {
      if (!icon.src) throw Error('missing manifest icon src')
      if (!icon.type) throw Error('missing manifest icon type')
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
  const iconEl = /** @type {HTMLLinkElement|null} */ (
    copy.querySelector('link[href][rel="icon"][type]')
  )
  if (iconEl) {
    const file = await fs.readFile(`${path.dirname(inFilename)}/${iconEl.href}`)
    iconEl.href = `data:${iconEl.type};base64,${file.toString('base64')}`
  }

  let js = ''
  if (watch)
    js +=
      "new globalThis.EventSource('/esbuild').addEventListener('change', () => globalThis.location.reload());"

  const outFiles =
    result.outputFiles?.filter(file => file.path.endsWith('.js')) ?? []
  if (outFiles.length > 1) throw Error('cannot concatenate JavaScript files')
  if (outFiles[0]) js += outFiles[0].text

  const scriptEl = /** @type {HTMLScriptElement|null} */ (
    copy.querySelector('script[type="module"][src]')
  )
  if (!scriptEl) throw Error('missing script')
  scriptEl.removeAttribute('src')
  scriptEl.textContent = `
  const atlasURI = '${atlasURI}'
  const atlas = ${atlasJSON}
  ${js}
`
  const outFilename = `${outDir}/${
    watch ? 'index' : `${path.basename(inFilename, '.html')}-v${pkg.version}`
  }.html`
  await fs.mkdir(path.dirname(outFilename), {recursive: true})
  await fs.writeFile(
    outFilename,
    `<!doctype html>${copy.documentElement.outerHTML}`
  )
}

/** @type {esbuild.BuildOptions} */
const buildOpts = {
  bundle: true,
  entryPoints: [srcFilename],
  format: 'esm',
  logLevel: `info`, // Print the port and build demarcations.
  minify: !watch,
  outdir: outDir,
  plugins: [{name: 'void', setup: build => build.onEnd(pluginOnEnd)}],
  sourcemap: 'linked',
  target: 'es2022', // https://esbuild.github.io/content-types/#tsconfig-json
  write: false // Written by plugin.
}
if (watch) {
  const ctx = await esbuild.context(buildOpts)
  await Promise.race([ctx.watch(), ctx.serve({port: 1234, servedir: 'dist'})])
} else await esbuild.build(buildOpts)
