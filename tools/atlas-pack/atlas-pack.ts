import path from 'node:path'
import type * as V from '../../src/index.ts'
import type {AtlasConfig} from '../types/config-file.ts'
import {exec} from '../utils/exec.ts'
import {globAll} from '../utils/file-util.ts'
import {parseAtlasJSON} from './atlas-json-parser.ts'

// to-do: separate executable?
export async function packAtlas(
  config: Readonly<AtlasConfig>
): Promise<V.AtlasJSON> {
  const filenames = await globAll(path.join(config.dir, '**.aseprite'))

  const webp = config.image.endsWith('.webp')
  const sheet = webp ? config.image.replace('.webp', '.png') : config.image
  const json = await exec(
    'aseprite',
    '--batch',
    '--color-mode=indexed',
    '--filename-format={title}--{tag}--{frame}',
    '--list-slices',
    '--list-tags',
    '--merge-duplicates',
    `--sheet=${sheet}`,
    '--sheet-pack',
    '--tagname-format={title}--{tag}',
    ...filenames
  )

  if (webp)
    await exec(
      'cwebp',
      '-exact',
      '-lossless',
      '-mt',
      '-quiet',
      '-z',
      '9',
      sheet,
      '-o',
      config.image
    )

  return parseAtlasJSON(JSON.parse(json))
}
