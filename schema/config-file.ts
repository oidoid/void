import {readFile} from 'node:fs/promises'
import path from 'node:path'
import type {WH} from '../src/index.ts'
import type {InitConfig} from '../src/types/game-config.ts'
import schema from './config-file.v0.json' with {type: 'json'}

export type AtlasConfig = {dir: string; image: string}

export type ConfigFile = {
  $schema: string
  entry: string
  meta: string | undefined
  out: {dir: string; game: string; name: string | undefined}
  preloadAtlas: AtlasConfig | undefined
  init: InitConfig

  /** config directory name. */
  dirname: string
  /** config filename. */
  filename: string
}

export type ConfigFileSchema = {
  $schema?: string | undefined
  entry?: string | undefined
  meta?: string | undefined
  out: {dir?: string | undefined; game: string; name?: string | undefined}
  preloadAtlas?: AtlasConfig | undefined
  init?: {
    background?: string | undefined
    input?: 'Custom' | 'Default' | undefined
    minWH?: Partial<WH> | undefined
    minScale?: number | undefined
    mode?: 'Float' | 'Int' | undefined
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

  const minWH: Partial<WH> = parseWH(json.init?.minWH)
  if (!minWH.w) delete minWH.w
  if (!minWH.h) delete minWH.h
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
      minWH,
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

function parseWH(wh: Readonly<Partial<WH>> | undefined): WH {
  return {w: wh?.w ?? 0, h: wh?.h ?? 0}
}
