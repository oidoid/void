import {readFile} from 'node:fs/promises'
import path from 'node:path'
import schema from '../../schema/config-file.v0.json' with {type: 'json'}
import * as V from '../../src/index.ts'

export type AtlasConfig = {dir: string; image: string}

export type ConfigFile = {
  $schema: string
  entry: string
  meta: string | undefined
  out: {dir: string; game: string; name: string | undefined; tagSchema: string}
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
  out: {dir?: string; game: string; name?: string; tagSchema: string}
  preloadAtlas?: AtlasConfig
  init?: {
    background?: string
    input: V.InputMode
    minWH: V.UnboundedWHSchema
    minScale?: number
    mode: V.RenderMode
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
    entry: path.resolve(dirname, json.entry ?? schema.properties.entry.default),
    meta: path.resolve(dirname, json.meta ?? schema.properties.meta.default),
    out: {
      dir: path.resolve(
        dirname,
        json.out.dir ?? schema.properties.out.properties.dir.default
      ),
      game: path.resolve(dirname, json.out.game),
      name: json.out.name,
      tagSchema: path.resolve(dirname, json.out.tagSchema)
    },
    preloadAtlas: json.preloadAtlas && {
      dir: path.resolve(dirname, json.preloadAtlas.dir),
      image: path.resolve(dirname, json.preloadAtlas.image)
    },
    init: {
      background: json.init?.background
        ? parseInt(json.init.background, 16)
        : undefined,
      input: json.init?.input ?? 'Default',
      minWH: json.init?.minWH
        ? V.parseWH(json.init.minWH)
        : {w: Infinity, h: Infinity},
      minScale: json.init?.minScale ?? 1,
      mode: json.init?.mode ?? 'Int',
      zoomOut: json.init?.zoomOut ?? 0
    },

    dirname,
    filename
  }
}
