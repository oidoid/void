#!/usr/bin/env -S node
// build.ts [--watch]
// --watch  run development server on http://localhost:1234 and reload on
//          code change.

import type {BuildOptions} from 'esbuild'
import esbuild from 'esbuild'

const watch = process.argv.includes('--watch')

const opts: BuildOptions = {
  bundle: true,
  format: 'esm',
  loader: {'.html': 'copy'},
  logLevel: 'info', // print the port and build demarcations.
  metafile: true,
  outbase: 'src', // strip the src/ prefix from the outputs.
  outdir: 'dist',
  sourcemap: 'linked',
  target: 'es2024' // https://esbuild.github.io/content-types/#tsconfig-json
}

const demoOpts: BuildOptions = {
  ...opts,
  banner: watch
    ? {
        js: "new EventSource('/esbuild').addEventListener('change', () => location.reload());"
      }
    : {},
  entryPoints: ['src/demo/demo.html', 'src/demo/demo.ts'],
  write: !watch
}
const voidOpts: BuildOptions = {...opts, entryPoints: ['src/void.ts']}

if (watch) {
  const demoCtx = await esbuild.context(demoOpts)
  const voidCtx = await esbuild.context(voidOpts)
  await Promise.all([
    demoCtx.watch(),
    voidCtx.watch(),
    demoCtx.serve({port: 1234, servedir: '.'})
  ])
} else await Promise.all([esbuild.build(demoOpts), esbuild.build(voidOpts)])
