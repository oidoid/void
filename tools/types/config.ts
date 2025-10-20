import path from 'node:path'
import type {AtlasConfig, ConfigFile} from '../../schema/config-file.ts'
import type {Argv} from '../utils/argv.ts'

export type Config = {
  $schema: string
  entry: string
  meta: string | undefined
  out: {dir: string; filename: string}
  preloadAtlas: AtlasConfig | undefined

  /** config directory name. */
  dirname: string
  /** config filename. */
  filename: string

  minify: boolean
  oneFile: boolean
  watch: boolean
}

export function Config(
  configFile: Readonly<ConfigFile>,
  argv: Readonly<Argv>,
  version: string | undefined
): Config {
  let stem = path.basename(configFile.entry).replace(/\.[^.]+$/, '')
  if (configFile.out.name && !argv.opts['--watch']) stem = configFile.out.name
  let suffix = '.html'
  if (version && !argv.opts['--watch']) suffix = `-v${version}.html`
  return {
    $schema: configFile.$schema,
    entry: configFile.entry,
    meta: configFile.meta,
    out: {dir: configFile.out.dir, filename: `${stem}${suffix}`},
    preloadAtlas: configFile.preloadAtlas,
    dirname: configFile.dirname,
    filename: configFile.filename,
    minify: argv.opts['--minify'] ?? false,
    oneFile: argv.opts['--one-file'] ?? false,
    watch: argv.opts['--watch'] ?? false
  }
}
