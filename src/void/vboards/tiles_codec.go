package vboards

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vrle"
)

const boardHeaderLen = 10

// serializes to little-endian:
// w(4) h(4) tileW(1) tileH(1)
// [tile(2) count8(1) [count16(2)]]*
// count8 zero escapes to count16; common short runs therefore use three bytes.
func EncodeBoard(board *Board) []byte {
	rle := vrle.Encode[Tile, uint16](board.Tiles)
	bin := make([]byte, boardHeaderLen, boardHeaderLen+len(rle)*3)
	w, h := uint32(board.W), uint32(board.H)
	bin[0], bin[1], bin[2], bin[3] = byte(w), byte(w>>8), byte(w>>16), byte(w>>24)
	bin[4], bin[5], bin[6], bin[7] = byte(h), byte(h>>8), byte(h>>16), byte(h>>24)
	bin[8], bin[9] = board.Tile.W, board.Tile.H
	for _, pair := range rle {
		bin = append(bin, byte(pair.Val), byte(pair.Val>>8))
		if pair.Count <= 255 {
			bin = append(bin, byte(pair.Count))
		} else {
			bin = append(bin, 0, byte(pair.Count), byte(pair.Count>>8))
		}
	}
	return bin
}

func DecodeBoard(bin []byte) Board {
	w := uint32(bin[0]) | uint32(bin[1])<<8 |
		uint32(bin[2])<<16 | uint32(bin[3])<<24
	h := uint32(bin[4]) | uint32(bin[5])<<8 |
		uint32(bin[6])<<16 | uint32(bin[7])<<24
	tile := vgeo.NewWH(bin[8], bin[9])
	total := w / uint32(tile.W) * (h / uint32(tile.H))
	tiles := make([]Tile, 0, total)
	for i := boardHeaderLen; i < len(bin); {
		val := Tile(uint16(bin[i]) | uint16(bin[i+1])<<8)
		count := uint16(bin[i+2])
		i += 3
		if count == 0 {
			count = uint16(bin[i]) | uint16(bin[i+1])<<8
			i += 2
		}
		for range count {
			tiles = append(tiles, val)
		}
	}
	return Board{
		WH:   vgeo.NewWH(int32(w), int32(h)),
		Tile: tile, Tiles: tiles,
	}
}
