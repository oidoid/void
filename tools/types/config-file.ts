import {readFile} from 'node:fs/promises'
import path from 'node:path'
import schema from '../../schema/config-file.v0.json' with {type: 'json'}
import type * as V from '../../src/index.ts'

export type AtlasConfig = {dir: string; image: string}

export type VoidConfigFile = {
  $schema: string
  entry: string
  meta: string | undefined
  out: {dir: string; game: string; name: string | undefined; tagSchema: string}
  atlas: AtlasConfig
  input: V.InputMode
  mode: V.RenderMode

  /** config directory name. */
  dirname: string
  /** config filename. */
  filename: string
}

export type VoidConfigFileSchema = {
  $schema?: string
  entry?: string
  meta?: string
  out: {dir?: string; game: string; name?: string; tagSchema: string}
  atlas: AtlasConfig
  input?: V.InputMode
  mode?: V.RenderMode
}

export async function parseConfigFile(
  filename: string
): Promise<VoidConfigFile> {
  let str
  try {
    str = await readFile(filename, 'utf8')
  } catch (err) {
    throw Error(`config ${filename} unreadable`, {cause: err})
  }

  return parse(filename, str)
}

/** @internal */
export function parse(filename: string, str: string): VoidConfigFile {
  const dirname = path.dirname(filename)
  let json: VoidConfigFileSchema
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
    atlas: {
      dir: path.resolve(dirname, json.atlas.dir),
      image: path.resolve(dirname, json.atlas.image)
    },
    input: json.input ?? 'Default',
    mode: json.mode ?? 'Int',

    dirname,
    filename
  }
}
