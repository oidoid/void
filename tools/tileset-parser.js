import {boxHits} from '../src/types/2d.js'
/** @typedef {import('./aseprite.js').Aseprite} Aseprite */
/** @typedef {import('../src/graphics/tileset.js').Tileset<string>} Tileset */
/** @typedef {import('../src/types/2d.js').Box} Box */
// to-do: /** @import {Aseprite} from './aseprite.js' */
// to-do: /** @import {Tileset} from '../src/atlas/tileset.js' */
// to-do: /** @import {Box} from '../src/types/2d.js' */

/**
 * @arg {Aseprite} ase
 * @arg {{readonly [tile: string]: null}} tiles
 * @return {Tileset}
 */
export function parseTileset(ase, tiles) {
  for (const tile in tiles)
    if (!ase.meta.slices.some(slice => slice.name === tile))
      throw Error(`no tile "${tile}"`)
  for (const slice of ase.meta.slices)
    if (!(slice.name in tiles)) throw Error(`unknown tile "${slice.name}"`)
  const tileWH = ase.meta.slices.find(slice => slice.name === 'TileWH')?.keys[0]
    ?.bounds
  if (!tileWH) throw Error('no TileWH hitbox')
  if (tileWH.w !== tileWH.h) throw Error('nonsquare TileWH')
  const side = tileWH.w

  const typeByTile = []
  const {w, h} = ase.meta.size
  for (let y = 0; y < h; y += side)
    for (let x = 0; x < w; x += side) {
      const hitboxes = ase.meta.slices.filter(
        box =>
          box.keys[0] && boxHits(box.keys[0].bounds, {x, y, w: side, h: side})
      )
      if (hitboxes.length > 1) throw Error(`excess hitboxes at (${x}, ${y})`)
      typeByTile.push(hitboxes[0]?.name)
    }
  return {h, side, tile: typeByTile, w}
}
