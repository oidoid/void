import fs from 'node:fs'
import esbuild from 'esbuild'
import * as V from '../../src/index.ts'
import {packAtlas, packTileset} from '../atlas-pack/pack-sheet.ts'
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
    target: 'es2023' // https://esbuild.github.io/content-types/#tsconfig-json
  }

  const atlas = await packAtlas(config.atlas)
  const tileset = config.tileset ? await packTileset(config.tileset) : undefined
  await writeVoidConfig(atlas, tileset, config)
  await writeTagSchema(atlas, tileset, config)

  if (config.watch) {
    fs.watch(config.atlas.dir, {recursive: true}, (ev, type) =>
      onWatchAssets(config, ev, type)
    )
    if (config.tileset)
      fs.watch(config.tileset.dir, {recursive: true}, (ev, type) =>
        onWatchTileset(config, ev, type)
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
    console.log(`sprite ${file} ${ev}.`)
    const atlas = await packAtlas(config.atlas)
    const tileset = config.tileset
      ? await packTileset(config.tileset)
      : undefined
    await writeVoidConfig(atlas, tileset, config)
    await writeTagSchema(atlas, tileset, config)
  },
  500 as V.Millis
)

const onWatchConfig = V.debounce(
  async (config: Readonly<Config>): Promise<void> => {
    const atlas = await packAtlas(config.atlas)
    const tileset = config.tileset
      ? await packTileset(config.tileset)
      : undefined
    await writeVoidConfig(atlas, tileset, config)
    await writeTagSchema(atlas, tileset, config)
  },
  500 as V.Millis
)

const onWatchTileset = V.debounce(
  async (
    config: Readonly<Config>,
    ev: fs.WatchEventType,
    file: string | null
  ): Promise<void> => {
    if (!config.tileset) return
    console.log(`tile ${file} ${ev}.`)
    const atlas = await packAtlas(config.atlas)
    const tileset = await packTileset(config.tileset)
    await writeVoidConfig(atlas, tileset, config)
    await writeTagSchema(atlas, tileset, config)
  },
  500 as V.Millis
)

async function writeVoidConfig(
  atlas: Readonly<V.AtlasJSON>,
  tileset: Readonly<V.Tileset> | undefined,
  config: Readonly<Config>
): Promise<void> {
  const gameConfig: V.VoidConfig = {
    atlas,
    input: config.input,
    mode: config.mode,
    tileset
  }
  await fs.promises.writeFile(config.out.game, JSON.stringify(gameConfig))
  try {
    await exec`biome check --fix ${config.out.game}`
  } catch {}
}

async function writeTagSchema(
  atlas: Readonly<V.AtlasJSON> | undefined,
  tileset: Readonly<V.Tileset> | undefined,
  config: Readonly<Config>
): Promise<void> {
  const tileMap: {[tile: string]: number} = {}
  for (const [i, tile] of (tileset?.tiles ?? []).entries()) tileMap[tile] = i
  const tagMap: {[tag: string]: number} = {}
  for (const [tag, anim] of Object.entries(atlas?.anim ?? {}))
    tagMap[tag] = anim.id
  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    description: 'tag schema.',
    $defs: {
      Tag: {
        description: 'sprite atlas tag.',
        enum: Object.keys(tagMap)
      },
      Tile: {
        description: 'tileset tile.',
        enum: Object.keys(tileMap)
      }
    },
    tags: tagMap,
    // TypeScript can only type the object keys of JSON imports so the enums
    // don't work. add an object for tiles. the atlas could be derived from
    // `AtlasJSON` but repeated above to avoid having to use two different
    // imports.
    tiles: tileMap
  }
  await fs.promises.writeFile(config.out.tagSchema, JSON.stringify(schema))
  try {
    await exec`biome check --fix ${config.out.tagSchema}`
  } catch {}
}
