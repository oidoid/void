package vlevels

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vrle"
)

// serializes tiles via RLE to: total(4) [tile(2) count(2)]*, little-endian.
func EncodeTiles(tiles []vatlas.AnimID) []byte {
	rle := vrle.Encode[vatlas.AnimID, uint16](tiles)
	total := uint32(len(tiles))
	bin := make([]byte, 4, 4+len(rle)*4)
	bin[0], bin[1] = byte(total), byte(total>>8)
	bin[2], bin[3] = byte(total>>16), byte(total>>24)
	for _, pair := range rle {
		bin = append(
			bin,
			byte(pair.Val), byte(pair.Val>>8),
			byte(pair.Count), byte(pair.Count>>8),
		)
	}
	return bin
}

// decodes tiles RLE-encoded by EncodeTiles.
func DecodeTiles(bin []byte) []vatlas.AnimID {
	total := uint32(bin[0]) | uint32(bin[1])<<8 |
		uint32(bin[2])<<16 | uint32(bin[3])<<24
	tiles := make([]vatlas.AnimID, 0, total)
	for i := 4; i < len(bin); i += 4 {
		val := vatlas.AnimID(uint16(bin[i]) | uint16(bin[i+1])<<8)
		count := uint16(bin[i+2]) | uint16(bin[i+3])<<8
		for range count {
			tiles = append(tiles, val)
		}
	}
	return tiles
}
