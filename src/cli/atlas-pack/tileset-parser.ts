import type * as V from '../../engine/index.ts'
import type * as ase from './aseprite.ts'

import './aseprite-json.ts'

export function parseTileset(json: Readonly<ase.Aseprite>): V.Tileset {
  const tiles: V.Tile[] = ['void--Nil']
  let tileWH: V.WH | undefined

  for (const [i, span] of json.meta.frameTags.entries()) {
    if (span.from !== span.to)
      throw Error(`tileset tag "${span.name}" is animated`)

    const frameTag = `${span.name}--${span.from}` as ase.FrameTag
    const frame = json.frames[frameTag]
    if (!frame) throw Error(`no tileset frame "${frameTag}"`)

    if (!tileWH) tileWH = frame.sourceSize
    if (tileWH.w !== frame.sourceSize.w || tileWH.h !== frame.sourceSize.h)
      throw Error(`tileset tile "${span.name}" size mismatch`)

    tiles[i + 1] = parseTile(span.name)
  }

  return {tiles, tileWH: tileWH ?? {w: 0, h: 0}}
}

function parseTile(tile: string): V.Tile {
  if (!tile.includes('--'))
    throw Error(`tileset tile "${tile}" not in <filestem>--<animation> format`)
  return tile as V.Tile
}
