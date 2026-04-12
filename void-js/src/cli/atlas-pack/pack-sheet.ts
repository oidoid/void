import path from 'node:path'
import type * as V from '../../engine/index.ts'
import type {SheetConfig} from '../types/config-file.ts'
import {exec} from '../utils/exec.ts'
import {globAll} from '../utils/file-util.ts'
import {parseAtlasJSON} from './atlas-json-parser.ts'
import {parseTileset} from './tileset-parser.ts'


export async function packTileset(
  config: Readonly<SheetConfig>
): Promise<V.Tileset> {
  const json = await packSheet(config)
  // to-do: Aseprite tileset support.
  return parseTileset(JSON.parse(json))
}

