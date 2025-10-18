import fs from 'node:fs/promises'
import path from 'node:path'
import {exec} from '../utils/exec.ts'
import {globAll} from '../utils/glob-all.ts'
import {parseAtlasJSON} from './atlas-json-parser.ts'

// to-do: separate executable?
export async function packAtlas(
  assetsDirname: string,
  imageFilename: string,
  jsonFilename: string
): Promise<void> {
  const filenames = await globAll(path.join(assetsDirname, '**.aseprite'))
  if (!filenames.length) return

  const json = await exec(
    'aseprite',
    '--batch',
    '--color-mode=indexed',
    '--filename-format={title}--{tag}--{frame}',
    '--list-slices',
    '--list-tags',
    '--merge-duplicates',
    `--sheet=${imageFilename}`,
    '--sheet-pack',
    '--tagname-format={title}--{tag}',
    ...filenames
  )
  await fs.writeFile(
    jsonFilename,
    JSON.stringify(parseAtlasJSON(JSON.parse(json)))
  )

  await exec('biome', 'check', '--fix', jsonFilename)
}
