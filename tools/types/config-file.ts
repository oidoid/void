import {readFile} from 'node:fs/promises'
import path from 'node:path'
import schema from '../../schema/config-file.v0.json' with {type: 'json'}
import type * as V from '../../src/index.ts'

export type AtlasConfig = {dir: string; image: string}

export type ConfigFile = {
  $schema: string
  entry: string
  meta: string | undefined
  out: {dir: string; game: string; name: string | undefined}
  preloadAtlas: AtlasConfig | undefined
  init: V.InitConfig

  /** config directory name. */
  dirname: string
  /** config filename. */
  filename: string
}

export type ConfigFileSchema = {
  $schema?: string
  entry?: string
  meta?: string
  out: {dir?: string; game: string; name?: string}
  preloadAtlas?: AtlasConfig
  init?: {
    background?: string
    input?: 'Custom' | 'Default'
    minWH?: Partial<V.WH>
    minScale?: number
    mode?: 'Float' | 'Int'
    zoomOut?: number
  }
}

export async function parseConfigFile(filename: string): Promise<ConfigFile> {
  let str
  try {
    str = await readFile(filename, 'utf8')
  } catch (err) {
    throw Error(`config ${filename} unreadable`, {cause: err})
  }

  return parse(filename, str)
}

/** @internal */
export function parse(filename: string, str: string): ConfigFile {
  const dirname = path.dirname(filename)
  let json: ConfigFileSchema
  try {
    json = JSON.parse(str)
  } catch (err) {
    throw Error(`config ${filename} unparsable`, {cause: err})
  }

  return {
    $schema: json.$schema ?? schema.properties.$schema.default,
    entry: path.join(dirname, json.entry ?? schema.properties.entry.default),
    meta: path.join(dirname, json.meta ?? schema.properties.meta.default),
    out: {
      dir: path.join(
        dirname,
        json.out.dir ?? schema.properties.out.properties.dir.default
      ),
      game: path.join(dirname, json.out.game),
      name: json.out.name
    },
    preloadAtlas: json.preloadAtlas && {
      dir: path.join(dirname, json.preloadAtlas.dir),
      image: path.join(dirname, json.preloadAtlas.image)
    },
    init: {
      background: json.init?.background
        ? parseInt(json.init.background, 16)
        : undefined,
      input:
        json.init?.input ??
        (schema.properties.init.properties.input.default as
          | 'Default'
          | 'Custom'),
      minWH: json.init?.minWH,
      minScale:
        json.init?.minScale ??
        schema.properties.init.properties.minScale.default,
      mode:
        json.init?.mode ??
        (schema.properties.init.properties.mode.default as 'Float' | 'Int'),
      zoomOut:
        json.init?.zoomOut ?? schema.properties.init.properties.zoomOut.default
    },

    dirname,
    filename
  }
}
