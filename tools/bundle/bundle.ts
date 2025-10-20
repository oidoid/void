import fs from 'node:fs'
import esbuild from 'esbuild'
import type {AtlasConfig} from '../../schema/config-file.ts'
import * as V from '../../src/index.ts'
import type {VoidVersion} from '../../src/types/void-version.ts'
import {packAtlas} from '../atlas-pack/atlas-pack.ts'
import type {Config} from '../types/config.ts'
import {HTMLPlugin} from './html-plugin.ts'

export async function bundle(
  config: Readonly<Config>,
  srcFilenames: readonly string[],
  voidVersion: Readonly<VoidVersion>
): Promise<void> {
  const opts: esbuild.BuildOptions = {
    banner: config.watch
      ? {
          js: "new EventSource('/esbuild').addEventListener('change', () => location.reload());"
        }
      : {},
    bundle: true,
    define: {
      // define on globalThis to avoid ReferenceError in unit tests.
      'globalThis.voidVersion': JSON.stringify(voidVersion)
    },
    entryPoints: [...srcFilenames],
    format: 'esm',
    logLevel: 'info', // print the port and build demarcations.
    metafile: true,
    minify: config.minify,
    outdir: config.out.dir,
    plugins: [HTMLPlugin(config)],
    sourcemap: 'linked',
    target: 'es2024' // https://esbuild.github.io/content-types/#tsconfig-json
  }

  if (config.preloadAtlas) await packAtlas(config.preloadAtlas, config.minify)
  if (config.preloadAtlas && config.watch) {
    fs.watch(config.preloadAtlas.dir, {recursive: true}, (ev, type) =>
      onWatch(config.preloadAtlas!, config.minify, ev, type)
    )
    const ctx = await esbuild.context(opts)
    await Promise.all([
      ctx.watch(),
      ctx.serve({port: 1234, servedir: config.out.dir})
    ])
  } else {
    const build = await esbuild.build(opts)
    if (config.meta)
      await fs.promises.writeFile(config.meta, JSON.stringify(build.metafile))
  }
}

const onWatch = V.debounce(
  async (
    config: Readonly<AtlasConfig>,
    minify: boolean,
    ev: fs.WatchEventType,
    file: string | null
  ) => {
    console.log(`asset ${file} ${ev}`)
    await packAtlas(config, minify)
  },
  500 as V.Millis
)
