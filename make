#!/usr/bin/env -S deno --quiet run --allow-env --allow-net --allow-read --allow-run --allow-write --ext ts
import * as esbuild from 'esbuild'
import { denoPlugins } from 'esbuild_deno_loader'
import { encodeBase64 } from 'std/encoding/base64.ts'
import { parse } from 'std/flags/mod.ts'
import * as path from 'std/path/mod.ts'
import { parseAtlas } from './src/atlas/atlas.ts'
import { NonNull } from './src/types/nonnull.ts'

const opts = parse(Deno.args, {
  string: ['in', 'title', 'favicon', 'out', 'watch'],
})

const inPath = NonNull(opts.in, 'missing source entry')
const title = NonNull(opts.title, 'missing title')
const favicon = NonNull(opts.favicon, 'missing favicon')
const origin = NonNull(opts.origin, 'missing origin')
const outPath = NonNull(opts.out, 'missing HTML output')
let serveDir = opts.watch?.replace(/^--watch=?/, '')
if (serveDir != null) serveDir ||= '.'

const atlasPNGFilename = await Deno.makeTempFile({ suffix: '.png' })
const ase = await exec(`
  aseprite
    --batch
    --color-mode=indexed
    --filename-format={title}--{tag}--{frame}
    --list-slices
    --list-tags
    --merge-duplicates
    --sheet-pack
    --sheet=${atlasPNGFilename}
    --tagname-format={title}--{tag}
    ${opts._.join(' ')}
`)
const faviconURIs: Record<never, never>[] = []
const faviconPNG = await Deno.makeTempFile({ suffix: '.png' })
for (const scale of [1, 2, 3, 4, 12, 32]) {
  await exec(
    `aseprite ${favicon} --batch --color-mode=indexed --scale=${scale} --save-as=${faviconPNG}`,
  )
  faviconURIs.push(
    `data:image/png;base64,${encodeBase64(await Deno.readFile(faviconPNG))}`,
  )
}

const atlasJSON = JSON.stringify(parseAtlas(JSON.parse(ase)))
const atlasURI = await `data:image/png;base64,${
  encodeBase64(await Deno.readFile(atlasPNGFilename))
}`
const manifest = {
  name: title,
  background_color: '#00000000',
  display: 'standalone',
  orientation: 'any',
  start_url: origin,
  icons: [
    { src: faviconURIs[0], sizes: '16x16', type: 'image/png' },
    { src: faviconURIs[1], sizes: '32x32', type: 'image/png' },
    { src: faviconURIs[2], sizes: '48x48', type: 'image/png' },
    { src: faviconURIs[3], sizes: '64x64', type: 'image/png' },
    { src: faviconURIs[4], sizes: '192x192', type: 'image/png' },
    { src: faviconURIs[5], sizes: '512x512', type: 'image/png' },
  ],
}

const watch = serveDir == null
  ? ''
  : `new EventSource('/esbuild').addEventListener('change', () => location.reload())`

const options: esbuild.BuildOptions = {
  bundle: true,
  entryPoints: [inPath],
  format: 'esm',
  outdir: serveDir || 'null',
  plugins: [
    ...denoPlugins({ configPath: path.join(Deno.cwd(), '/deno.json') }),
    {
      name: 'htmlPlugin',
      setup(build) {
        build.onEnd(async (result) => {
          const html = `
<!doctype html>
<html lang='en'>
  <head>
    <meta charset='utf-8'>
    <title>${title}</title>
    <link rel='icon' href='${faviconURIs[0]}'>
    <link rel='manifest' href='data:application/json,${
            encodeURIComponent(JSON.stringify(manifest))
          }'>
    <script type='module'>
${watch}
const atlasURI = '${atlasURI}'
const atlas = ${atlasJSON}
${result.outputFiles?.map((file) => file.text).join('') ?? ''}
    </script>
  </head>
</html>
          `.trim()
          await Deno.writeTextFile(outPath, html)
        })
      },
    },
  ],
  target: 'es2022', // https://esbuild.github.io/content-types/#tsconfig-json
  write: false,
}

if (serveDir == null) {
  await esbuild.build(options)
  esbuild.stop()
} else {
  const ctx = await esbuild.context(options)
  await Promise.all([
    ctx.watch(),
    ctx.serve({ port: 1234, servedir: serveDir }),
  ])
}

async function exec(cmd: string): Promise<string> {
  const [exe, ...args] = cmd.trim().split(/\s+/)
  const out = await new Deno.Command(exe!, { args }).output()
  if (out.success) return new TextDecoder().decode(out.stdout)
  console.error(new TextDecoder().decode(out.stderr))
  Deno.exit(out.code)
}
