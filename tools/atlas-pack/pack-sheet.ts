import path from 'node:path'
import type * as V from '../../src/index.ts'
import type {SheetConfig} from '../types/config-file.ts'
import {exec} from '../utils/exec.ts'
import {globAll} from '../utils/file-util.ts'
import {parseAtlasJSON} from './atlas-json-parser.ts'
import {parseTileset} from './tileset-parser.ts'

export async function packAtlas(
  config: Readonly<SheetConfig>
): Promise<V.AtlasJSON> {
  const json = await packSheet(config)
  return parseAtlasJSON(JSON.parse(json))
}

export async function packTileset(
  config: Readonly<SheetConfig>
): Promise<V.Tileset> {
  const json = await packSheet(config)
  // to-do: Aseprite tileset support.
  return parseTileset(JSON.parse(json))
}

// to-do: separate executable?
async function packSheet(config: Readonly<SheetConfig>): Promise<string> {
  const filenames = await globAll(path.join(config.dir, '**.aseprite'))

  const webp = config.image.endsWith('.webp')
  const sheet = webp ? config.image.replace('.webp', '.png') : config.image
  const json = await exec`
    aseprite
    --batch
    --color-mode=indexed
    --filename-format={title}--{tag}--{frame}
    --list-slices
    --list-tags
    --merge-duplicates
    --sheet=${sheet}
    --sheet-pack
    --tagname-format={title}--{tag}
    ${filenames.join(' ')}
  `

  if (webp)
    await exec`
      cwebp
      -exact
      -lossless
      -mt
      -quiet
      -z
      9
      ${sheet}
      -o
      ${config.image}
    `

  return json
}
