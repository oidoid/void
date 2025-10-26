import path from 'node:path'
import type {AtlasConfig, ConfigFile} from '../../schema/config-file.ts'
import type {Bundle} from '../../src/types/bundle.ts'
import type {Argv} from '../utils/argv.ts'
import type {PackageJSON} from './package-json.ts'

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

  bundle: Bundle
}

export function Config(
  argv: Readonly<Argv>,
  configFile: Readonly<ConfigFile>,
  hash: string,
  packageJSON: Readonly<PackageJSON>
): Config {
  let fileStem = path.basename(configFile.entry).replace(/\.[^.]+$/, '')
  if (configFile.out.name && !argv.opts['--watch'])
    fileStem = configFile.out.name
  let fileSuffix = '.html'
  if (!argv.opts['--watch']) {
    const version = packageJSON.version ? `v${packageJSON.version}` : ''
    const published =
      packageJSON.version && packageJSON.published
        ? `+${packageJSON.published}`
        : ''
    const hashStr = packageJSON.version && hash ? `.${hash}` : ''
    fileSuffix = `-${version}${published}${hashStr}.html`
  }
  return {
    $schema: configFile.$schema,
    entry: configFile.entry,
    meta: configFile.meta,
    out: {dir: configFile.out.dir, filename: `${fileStem}${fileSuffix}`},
    preloadAtlas: configFile.preloadAtlas,
    dirname: configFile.dirname,
    filename: configFile.filename,
    minify: argv.opts['--minify'] ?? false,
    oneFile: argv.opts['--one-file'] ?? false,
    watch: argv.opts['--watch'] ?? false,
    bundle: {
      hash,
      published: packageJSON.published,
      version: packageJSON.version
    }
  }
}
