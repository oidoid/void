import {readFile} from 'node:fs/promises'
import path from 'node:path'
import schema from './config-file.v0.json' with {type: 'json'}

export type AtlasConfig = {dir: string; image: string; json: string}

export type ConfigFile = {
  $schema: string
  entry: string
  meta: string | undefined
  out: {dir: string; name: string | undefined}
  preloadAtlas: AtlasConfig | undefined

  /** config directory name. */
  dirname: string
  /** config filename. */
  filename: string
}

export type ConfigFileSchema = {
  $schema?: string | undefined
  entry?: string | undefined
  meta?: string | undefined
  out?: {dir?: string | undefined; name?: string | undefined} | undefined
  preloadAtlas?: AtlasConfig | undefined
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
        json.out?.dir ?? schema.properties.out.properties.dir.default
      ),
      name: json.out?.name
    },
    preloadAtlas: json.preloadAtlas && {
      dir: path.join(dirname, json.preloadAtlas.dir),
      image: path.join(dirname, json.preloadAtlas.image),
      json: path.join(dirname, json.preloadAtlas.json)
    },

    dirname,
    filename
  }
}
