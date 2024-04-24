#!/usr/bin/env -S node --no-warnings
// Bundles sources into a single HTML file for distribution and development.
//
// void [--watch] assets.json
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
import {parseAtlas} from './atlas-parser.js'
/** @typedef {import('../src/atlas/config.js').Config} Config */

const watch = process.argv.includes('--watch')
const configFilename =
  process.argv.slice(2).filter(arg => !arg.startsWith('--'))[0] ?? '/dev/null'
/** @type {Config} */ const config = JSON.parse(
  await fs.readFile(configFilename, 'utf8')
)

if (!config.atlas) throw Error('no atlas input')
if (!config.html) throw Error('no HTML input')
if (!config.out) throw Error('no output directory')
if (!config.tags) throw Error('no tags')

const configDir = path.dirname(configFilename)

const htmlInFilename = path.resolve(configDir, config.html)
const htmlInDir = path.dirname(htmlInFilename)

const doc = new JSDOM(await fs.readFile(htmlInFilename, 'utf8')).window.document
let srcFilename = /** @type {HTMLScriptElement|null} */ (
  doc.querySelector('script[type="module"][src]')
)?.src
if (!srcFilename) throw Error('missing script source')
srcFilename = path.resolve(htmlInDir, srcFilename)

const outDir = path.resolve(configDir, config.out)

const atlasDir = path.resolve(configDir, config.atlas)
const atlasFilenames = (await fs.readdir(atlasDir))
  .filter(name => name.endsWith('.aseprite'))
  .map(name => path.resolve(atlasDir, name))
const atlasImageFilename = `${await fs.mkdtemp('/tmp/', {encoding: 'utf8'})}/atlas.png`
const atlasAse = await execAse(
  '--batch',
  '--color-mode=indexed',
  '--filename-format={title}--{tag}--{frame}',
  // '--ignore-empty', Breaks --tagname-format.
  '--list-slices',
  '--list-tags',
  '--merge-duplicates',
  `--sheet=${atlasImageFilename}`,
  '--sheet-pack',
  '--tagname-format={title}--{tag}',
  ...atlasFilenames
)

const atlasJSON = JSON.stringify(parseAtlas(JSON.parse(atlasAse), config.tags))
const atlasURI =
  await `data:image/png;base64,${(await fs.readFile(atlasImageFilename)).toString('base64')}`

/** @type {Parameters<esbuild.PluginBuild['onEnd']>[0]} */
async function pluginOnEnd(result) {
  const copy = /** @type {Document} */ (doc.cloneNode(true))
  const manifestEl = /** @type {HTMLLinkElement|null} */ (
    copy.querySelector('link[href][rel="manifest"]')
  )
  let manifestFilename
  if (manifestEl) {
    manifestFilename = path.resolve(htmlInDir, manifestEl.href)
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
  if (outFiles[0]) js += outFiles[0].text

  const scriptEl = /** @type {HTMLScriptElement|null} */ (
    copy.querySelector('script[type="module"][src]')
  )
  if (!scriptEl) throw Error('missing script')
  scriptEl.removeAttribute('src')
  scriptEl.textContent = `
  const atlas = ${atlasJSON}
  const atlasURI = '${atlasURI}'
  ${js}
`
  const outFilename = `${outDir}/${
    watch ? 'index' : `${path.basename(config.html, '.html')}-v${pkg.version}`
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

/**
 * @arg {readonly string[]} args
 * @return {Promise<string>}
 */
async function execAse(...args) {
  const [err, stdout, stderr] = await new Promise(resolve =>
    execFile('aseprite', args, (err, stdout, stderr) =>
      resolve([err, stdout, stderr])
    )
  )
  process.stderr.write(stderr)
  if (err) throw err
  return stdout
}
