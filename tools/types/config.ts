import path from 'node:path'
import type {Bundle} from '../../src/types/bundle.ts'
import type {InitConfig} from '../../src/types/game-config.ts'
import {Argv} from '../utils/argv.ts'
import {exec} from '../utils/exec.ts'
import {
  type AtlasConfig,
  type ConfigFile,
  parseConfigFile
} from './config-file.ts'
import type {PackageJSON} from './package-json.ts'

export type Config = {
  $schema: string
  entry: string
  meta: string | undefined
  out: {dir: string; game: string; filename: string}
  preloadAtlas: AtlasConfig | undefined
  init: InitConfig

  /** config directory name. */
  dirname: string
  /** config filename. */
  filename: string

  minify: boolean
  oneFile: boolean
  watch: boolean

  bundle: Bundle

  argv: Argv
}

export async function readConfig(args: readonly string[]): Promise<Config> {
  const argv = Argv(args)
  const configFile = await parseConfigFile(argv.opts['--config'] ?? 'void.json')
  const hash = (await exec('git', 'rev-parse', '--short', 'HEAD')).trim()
  const packageJSON: PackageJSON = JSON.parse(
    (await exec('npm', 'pkg', 'get', 'version', 'published')) || '{}'
  )
  return Config(argv, configFile, hash, packageJSON)
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
    out: {
      dir: configFile.out.dir,
      game: configFile.out.game,
      filename: `${fileStem}${fileSuffix}`
    },
    preloadAtlas: configFile.preloadAtlas,
    init: configFile.init,
    dirname: configFile.dirname,
    filename: configFile.filename,
    minify: argv.opts['--minify'] ?? false,
    oneFile: argv.opts['--one-file'] ?? false,
    watch: argv.opts['--watch'] ?? false,
    bundle: {
      hash,
      published: packageJSON.published,
      version: packageJSON.version
    },
    argv
  }
}
