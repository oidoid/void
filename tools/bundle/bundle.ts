import fs from 'node:fs'
import esbuild from 'esbuild'
import type {ConfigFile} from '../../schema/config-file.ts'
import type {Millis} from '../../src/types/time.ts'
import type {Version} from '../../src/types/version.ts'
import {debounce} from '../../src/utils/async-util.ts'
import {packAtlas} from '../atlas-pack/atlas-pack.ts'
import type {Argv} from '../utils/argv.ts'
import {HTMLPlugin} from './html-plugin.ts'

export async function bundle(
  argv: Readonly<Argv>,
  config: Readonly<ConfigFile>,
  srcFilenames: readonly string[],
  version: Readonly<Version>
): Promise<void> {
  const opts: esbuild.BuildOptions = {
    banner: argv.opts['--watch']
      ? {
          js: "new EventSource('/esbuild').addEventListener('change', () => location.reload());"
        }
      : {},
    bundle: true,
    define: {
      // define on globalThis to avoid ReferenceError in unit tests.
      'globalThis.voidVersion': JSON.stringify(version)
    },
    entryPoints: [...srcFilenames],
    format: 'esm',
    logLevel: 'info', // print the port and build demarcations.
    metafile: true,
    minify: argv.opts['--minify'] ?? false,
    outdir: config.out,
    plugins: [HTMLPlugin(argv, config)],
    sourcemap: 'linked',
    target: 'es2024' // https://esbuild.github.io/content-types/#tsconfig-json
  }

  await packAtlas(config.atlas.assets, config.atlas.image, config.atlas.json)
  if (argv.opts['--watch']) {
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
      await fs.promises.writeFile(config.meta, JSON.stringify(build.metafile))
  }
}

const onWatch = debounce(
  async (
    config: Readonly<ConfigFile>,
    ev: fs.WatchEventType,
    file: string | null
  ) => {
    console.log(`${file}: ${ev}`)
    await packAtlas(config.atlas.assets, config.atlas.image, config.atlas.json)
  },
  500 as Millis
)
