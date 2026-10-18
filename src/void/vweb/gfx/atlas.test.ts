import assert from 'node:assert/strict'
import {test} from 'node:test'
import * as bridge from '../eng/bridge.ts'
import {packAtlasTexels} from './atlas.ts'

function source(counts: number[]) {
  const metas = new DataView(
    new ArrayBuffer(counts.length * bridge.tagMetaStride)
  )
  const total = counts.reduce((sum, count) => sum + count, 0)
  const cels = new DataView(new ArrayBuffer(total * bridge.atlasCelStride))
  let first = 0
  for (let tag = 0; tag < counts.length; tag++) {
    const offset = tag * bridge.tagMetaStride
    metas.setUint16(offset + bridge.tagMetaCelIndexOffset, first, true)
    metas.setUint8(offset + bridge.tagMetaCelsOffset, counts[tag]!)
    metas.setUint16(offset + bridge.tagMetaWOffset, tag + 1, true)
    metas.setUint16(offset + bridge.tagMetaHOffset, tag + 2, true)
    first += counts[tag]!
  }
  for (let cel = 0; cel < total; cel++) {
    cels.setUint16(
      cel * bridge.atlasCelStride + bridge.atlasCelXOffset,
      cel,
      true
    )
    cels.setUint16(
      cel * bridge.atlasCelStride + bridge.atlasCelYOffset,
      cel >>> 16,
      true
    )
  }
  return packAtlasTexels(metas, cels)
}

function lookup(texels: Uint16Array, tag: number, cel: number) {
  const first = texels[tag * 2]! | (texels[tag * 2 + 1]! << 16)
  return [...texels.slice((first + cel) * 4, (first + cel + 1) * 4)]
}

test('compact atlas packs odd tag counts and distinct cel ranges', () => {
  const texels = source([1, 3, 1])
  assert.equal(texels.byteLength, 16 + 5 * 8)
  assert.deepEqual(lookup(texels, 0, 0), [0, 0, 1, 2])
  assert.deepEqual(lookup(texels, 1, 2), [3, 0, 2, 3])
  assert.deepEqual(lookup(texels, 2, 0), [4, 0, 3, 4])
})

test('compact atlas supports 65535 cels with texture addresses beyond 65535', () => {
  const texels = source(Array<number>(257).fill(255))
  assert.equal(texels.byteLength, 258 * 4 + 65535 * 8) // header pads odd tag count.
  assert.deepEqual(lookup(texels, 256, 254), [65534, 0, 257, 258])
  assert.deepEqual(lookup(texels, 0, 254), [254, 0, 1, 2])
})

test('empty atlas has no CPU padding', () => {
  assert.equal(source([]).byteLength, 0)
})
