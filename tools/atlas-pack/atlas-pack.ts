import path from 'node:path'
import type {AtlasConfig} from '../../schema/config-file.ts'
import type {AtlasJSON} from '../../src/types/game-config.ts'
import {exec} from '../utils/exec.ts'
import {globAll} from '../utils/file-util.ts'
import {parseAtlasJSON} from './atlas-json-parser.ts'

// to-do: separate executable?
export async function packAtlas(
  config: Readonly<AtlasConfig>
): Promise<AtlasJSON | undefined> {
  const filenames = await globAll(path.join(config.dir, '**.aseprite'))
  if (!filenames.length) return

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
