import fs from 'node:fs/promises'
import path from 'node:path'
import type {AtlasConfig} from '../../schema/config-file.ts'
import {exec} from '../utils/exec.ts'
import {globAll} from '../utils/file-util.ts'
import {parseAtlasJSON} from './atlas-json-parser.ts'

// to-do: separate executable?
export async function packAtlas(
  config: Readonly<AtlasConfig>,
  minify: boolean
): Promise<void> {
  const filenames = await globAll(path.join(config.dir, '**.aseprite'))
  if (!filenames.length) return

  const json = await exec(
    'aseprite',
    '--batch',
    '--color-mode=indexed',
    '--filename-format={title}--{tag}--{frame}',
    '--list-slices',
    '--list-tags',
    '--merge-duplicates',
    `--sheet=${config.image}`,
    '--sheet-pack',
    '--tagname-format={title}--{tag}',
    ...filenames
  )

  if (minify) await exec('zopflipng', '-y', config.image, config.image)

  await fs.writeFile(
    config.json,
    JSON.stringify(parseAtlasJSON(JSON.parse(json)))
  )

  await exec('biome', 'check', '--fix', config.json)
}
