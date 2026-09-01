package vboards

import (
	"reflect"
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
)

func TestBoardRoundTrip(t *testing.T) {
	cases := map[string]Board{
		"empty": {
			WH: vgeo.NewWH[int32](0, 0), Tile: vgeo.NewWH[uint8](1, 1),
		},
		"single": {
			WH: vgeo.NewWH[int32](8, 8), Tile: vgeo.NewWH[uint8](8, 8),
			Tiles: []Tile{5},
		},
		"all same": {
			WH: vgeo.NewWH[int32](32, 8), Tile: vgeo.NewWH[uint8](8, 8),
			Tiles: []Tile{2, 2, 2, 2},
		},
		"mixed": {
			WH: vgeo.NewWH[int32](32, 16), Tile: vgeo.NewWH[uint8](8, 8),
			Tiles: []Tile{1, 1, 0, 0, 0, NewTile(3, true), 1, 1},
		},
		"no repeats": {
			WH: vgeo.NewWH[int32](32, 8), Tile: vgeo.NewWH[uint8](8, 8),
			Tiles: []Tile{1, 2, 3, 4},
		},
		"long run": {
			WH: vgeo.NewWH[int32](256, 1), Tile: vgeo.NewWH[uint8](1, 1),
			Tiles: make([]Tile, 256),
		},
	}
	for name, board := range cases {
		t.Run(name, func(t *testing.T) {
			got := DecodeBoard(EncodeBoard(&board))
			if len(got.Tiles) == 0 && len(board.Tiles) == 0 {
				got.Tiles, board.Tiles = nil, nil
			}
			if !reflect.DeepEqual(got, board) {
				t.Fatalf("got %v, want %v", got, board)
			}
		})
	}
}

func TestBoardRunEncodingLength(t *testing.T) {
	for _, test := range []struct {
		name        string
		count, want int
	}{
		{"short", 255, boardHeaderLen + 3},
		{"long", 256, boardHeaderLen + 5},
	} {
		t.Run(test.name, func(t *testing.T) {
			board := Board{
				WH:    vgeo.NewWH(int32(test.count), int32(1)),
				Tile:  vgeo.NewWH[uint8](1, 1),
				Tiles: make([]Tile, test.count),
			}
			if got := len(EncodeBoard(&board)); got != test.want {
				t.Fatalf("encoded length = %d, want %d", got, test.want)
			}
		})
	}
}
