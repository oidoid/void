import {
  atlasCelStride,
  atlasCelXOffset,
  atlasCelYOffset,
  tagMetaCelIndexOffset,
  tagMetaCelsOffset,
  tagMetaHOffset,
  tagMetaStride,
  tagMetaWOffset
} from '../eng/bridge.ts'

/**
 * packs source records once for the GPU. a texel is one texture element; here
 * its four RGBA16UI channels. header texels hold two uint32 offsets as low/high
 * pairs. each following texel holds one cel's `XYWH`. offsets count texels from
 * the texture start.
 */
export function packAtlasTexels(metas: DataView, cels: DataView): Uint16Array {
  const count = metas.byteLength / tagMetaStride
  const header = (count * 2 + 3) & ~3 // uint16 count, rounded to whole texels.
  const texels = new Uint16Array(
    header + (cels.byteLength / atlasCelStride) * 4
  )
  for (let tag = 0; tag < count; tag++) {
    const offset = tag * tagMetaStride
    const first = metas.getUint16(offset + tagMetaCelIndexOffset, true)
    const start = header / 4 + first
    texels[tag * 2] = start & 0xffff
    texels[tag * 2 + 1] = start >>> 16
    const count = metas.getUint8(offset + tagMetaCelsOffset)
    const w = metas.getUint16(offset + tagMetaWOffset, true)
    const h = metas.getUint16(offset + tagMetaHOffset, true)
    for (let cel = 0; cel < count; cel++) {
      const src = (first + cel) * atlasCelStride
      const dst = (start + cel) * 4
      texels[dst] = cels.getUint16(src + atlasCelXOffset, true)
      texels[dst + 1] = cels.getUint16(src + atlasCelYOffset, true)
      texels[dst + 2] = w
      texels[dst + 3] = h
    }
  }
  return texels
}
