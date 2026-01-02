import fs from 'node:fs'
import esbuild from 'esbuild'
import * as V from '../../src/index.ts'
import {packAtlas} from '../atlas-pack/atlas-pack.ts'
import {type Config, readConfig} from '../types/config.ts'
import {exec} from '../utils/exec.ts'
import {HTMLPlugin} from './html-plugin.ts'

export async function bundle(
  config: Readonly<Config>,
  srcFilenames: readonly string[]
): Promise<void> {
  const opts: esbuild.BuildOptions = {
    banner: config.watch
      ? {
          js: "new EventSource('/esbuild').addEventListener('change', () => location.reload());"
        }
      : {},
    bundle: true,
    conditions: config.conditions,
    define: {
      // define on globalThis to avoid ReferenceError in unit tests.
      'globalThis.bundle': JSON.stringify(config.bundle)
    },
    entryPoints: [...srcFilenames],
    format: 'esm',
    logLevel: 'info', // print the port and build demarcations.
    metafile: true,
    minify: config.minify,
    outdir: config.out.dir,
    plugins: [HTMLPlugin(config)],
    tsconfig: config.tsconfigFilename,
    sourcemap: 'linked',
    target: 'es2024' // https://esbuild.github.io/content-types/#tsconfig-json
  }

  let atlas
  if (config.preloadAtlas) atlas = await packAtlas(config.preloadAtlas)
  await writeGameConfig(atlas, config)

  if (config.watch) {
    if (config.preloadAtlas)
      fs.watch(config.preloadAtlas.dir, {recursive: true}, (ev, type) =>
        onWatchAssets(config, ev, type)
      )
    fs.watch(config.filename, async (ev, type) => {
      console.log(`config ${type} ${ev}.`)
      config = await readConfig(config.argv.argv)
      onWatchConfig(config)
    })
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

const onWatchAssets = V.debounce(
  async (
    config: Readonly<Config>,
    ev: fs.WatchEventType,
    file: string | null
  ): Promise<void> => {
    console.log(`asset ${file} ${ev}.`)
    const atlas = await packAtlas(config.preloadAtlas!)
    await writeGameConfig(atlas, config)
  },
  500 as V.Millis
)

const onWatchConfig = V.debounce(
  async (config: Readonly<Config>): Promise<void> => {
    let atlas
    if (config.preloadAtlas) atlas = await packAtlas(config.preloadAtlas)
    await writeGameConfig(atlas, config)
  },
  500 as V.Millis
)

async function writeGameConfig(
  atlas: Readonly<V.AtlasJSON> | undefined,
  config: Readonly<Config>
): Promise<void> {
  const gameConfig: V.GameConfig = {atlas, init: config.init}
  await fs.promises.writeFile(config.out.game, JSON.stringify(gameConfig))
  try {
    await exec('biome', 'check', '--fix', config.out.game)
  } catch {}
}
