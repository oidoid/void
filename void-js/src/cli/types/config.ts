import path from 'node:path'
import type * as V from '../../engine/index.ts'
import {Argv} from '../utils/argv.ts'
import {exec} from '../utils/exec.ts'
import {
  parseConfigFile,
  type SheetConfig,
  type VoidConfigFile
} from './config-file.ts'
import type {PackageJSON} from './package-json.ts'

export type Config = {
  out: { game: string; tagSchema: string}
  atlas: SheetConfig
  tileset: SheetConfig | undefined
  input: V.InputMode
  mode: V.RenderMode

  bundle: V.Bundle
}


export async function readConfig(args: readonly string[]): Promise<Config> {
  const argv = Argv<Opts>(args)
  const configFile = await parseConfigFile(argv.opts['--config'] ?? 'void.json')

  let hash = '0000000'
  try {
    hash = (await exec`git rev-parse --short HEAD`).trim()
  } catch {}

  const packageJSON: PackageJSON = JSON.parse(
    (await exec`npm pkg get version published`) || '{}'
  )

  return Config(argv, configFile, hash, packageJSON, tsconfigFilename, tsconfig)
}

/** @internal */
export function Config(
  argv: Readonly<Argv<Opts>>,
  configFile: Readonly<VoidConfigFile>,
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
    atlas: configFile.atlas,
    tileset: configFile.tileset,
    input: configFile.input,
    mode: configFile.mode,
    dirname: configFile.dirname,
    filename: configFile.filename,
    tsconfigFilename,
    conditions: tsconfig.compilerOptions?.customConditions ?? [],
    minify: argv.opts['--minify'] ?? false,
    oneFile: argv.opts['--one-file'] ?? false,
    port: parseInt(`${argv.opts['--watch']}`, 10) || 1234,
    watch: argv.opts['--watch'] != null,
    bundle: {
      hash,
      published: packageJSON.published,
      version: packageJSON.version
    },
    argv
  }
}
