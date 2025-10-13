import {readFileSync} from 'node:fs'
import path from 'node:path'
import schema from './config-file.v0.json' with {type: 'json'}

export type ConfigFile = {
  $schema: string
  atlas: {assets: string; image: string; json: string}
  entry: string
  out: string
}

export type ConfigFileSchema = {
  $schema?: string
  atlas?: {assets?: string; image?: string; json?: string}
  entry?: string
  out?: string
}

export function parseConfigFile(filename: string): ConfigFile {
  let str
  try {
    str = readFileSync(filename, 'utf8')
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
    atlas: {
      assets: path.join(
        dirname,
        json.atlas?.assets ?? schema.properties.atlas.properties.assets.default
      ),
      image: path.join(
        dirname,
        json.atlas?.image ?? schema.properties.atlas.properties.image.default
      ),
      json: path.join(
        dirname,
        json.atlas?.json ?? schema.properties.atlas.properties.json.default
      )
    },
    entry: path.join(dirname, json.entry ?? schema.properties.entry.default),
    out: path.join(dirname, json.out ?? schema.properties.out.default)
  }
}
