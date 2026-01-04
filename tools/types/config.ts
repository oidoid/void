import {readFile} from 'node:fs/promises'
import path from 'node:path'
import type * as V from '../../src/index.ts'
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
  out: {dir: string; game: string; filename: string; tagSchema: string}
  preloadAtlas: AtlasConfig | undefined
  init: V.InitConfig

  /** config directory name. */
  dirname: string
  /** config filename. */
  filename: string
  tsconfigFilename: string

  conditions: string[]
  minify: boolean
  oneFile: boolean
  watch: boolean

  bundle: V.Bundle

  argv: Argv
}

export type TSConfig = {compilerOptions?: {customConditions?: string[]}}

export async function readConfig(args: readonly string[]): Promise<Config> {
  const argv = Argv(args)
  const configFile = await parseConfigFile(argv.opts['--config'] ?? 'void.json')

  let hash = '0000000'
  try {
    hash = (await exec('git', 'rev-parse', '--short', 'HEAD')).trim()
  } catch {}

  const packageJSON: PackageJSON = JSON.parse(
    (await exec('npm', 'pkg', 'get', 'version', 'published')) || '{}'
  )
  const tsconfigFilename = path.resolve(
    configFile.dirname,
    argv.opts['--tsconfig'] ?? 'tsconfig.json'
  )
  const tsconfig = await readTSConfig(tsconfigFilename)

  return Config(argv, configFile, hash, packageJSON, tsconfigFilename, tsconfig)
}

/** @internal */
export function Config(
  argv: Readonly<Argv>,
  configFile: Readonly<ConfigFile>,
  hash: string,
  packageJSON: Readonly<PackageJSON>,
  tsconfigFilename: string,
  tsconfig: Readonly<TSConfig>
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
      filename: `${fileStem}${fileSuffix}`,
      tagSchema: configFile.out.tagSchema
    },
    preloadAtlas: configFile.preloadAtlas,
    init: configFile.init,
    dirname: configFile.dirname,
    filename: configFile.filename,
    tsconfigFilename,
    conditions: tsconfig.compilerOptions?.customConditions ?? [],
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

async function readTSConfig(filename: string): Promise<TSConfig> {
  let str
  try {
    str = await readFile(filename, 'utf8')
  } catch (err) {
    throw Error(`tsconfig ${filename} unreadable`, {cause: err})
  }
  return parseTSConfig(str, filename)
}

/** @internal */
export function parseTSConfig(jsonc: string, filename: string): TSConfig {
  const stripped = jsonc
    .replace(
      /("(?:\\.|[^"\\])*")|\/\/[^\r\n]*/g,
      (_match, group0?: string) => group0 ?? ''
    )
    .replace(/,(\s*[}\]])/g, '$1') // trailing commas.

  try {
    return JSON.parse(stripped)
  } catch (err) {
    throw Error(`tsconfig ${filename} unparseable`, {cause: err})
  }
}
