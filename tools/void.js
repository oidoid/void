#!/usr/bin/env node
// Bundles sources into a single HTML file for distribution and development.
//
// void [--watch] <input> <output>
// <input> HTML input filename.
// <output> HTML output directory.
// --watch  Run development server. Serve on http://localhost:1234 and reload on
//          code change.

import esbuild from 'esbuild'
import {JSDOM} from 'jsdom'
import fs from 'node:fs/promises'
import path from 'node:path'
import pkg from '../package.json' assert {type: 'json'}

const watch = process.argv.includes('--watch')
const _inFilename = process.argv.at(-2)
if (!_inFilename) throw Error('missing input')
const inFilename = _inFilename
const outDir = process.argv.at(-1)
if (!outDir) throw Error('missing output')
const doc = new JSDOM(await fs.readFile(inFilename, 'utf8')).window.document
let srcFilename = /** @type {HTMLScriptElement|null} */ (
  doc.querySelector('script[type="module"][src]')
)?.src
if (!srcFilename) throw Error('missing script source')
srcFilename = `${path.dirname(inFilename)}/${srcFilename}`

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
  scriptEl.textContent = js
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
const opts = {
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
  const ctx = await esbuild.context(opts)
  await Promise.race([ctx.watch(), ctx.serve({port: 1234, servedir: 'dist'})])
} else await esbuild.build(opts)
