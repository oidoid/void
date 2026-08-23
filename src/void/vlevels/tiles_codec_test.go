package vlevels

import (
	"reflect"
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
)

func TestLevelRoundTrip(t *testing.T) {
	cases := map[string]Level{
		"empty": {
			WH: vgeo.NewWH[int32](0, 0), Tile: vgeo.NewWH[uint8](1, 1),
		},
		"single": {
			WH: vgeo.NewWH[int32](8, 8), Tile: vgeo.NewWH[uint8](8, 8),
			Tiles: []vatlas.AnimID{5},
		},
		"all same": {
			WH: vgeo.NewWH[int32](32, 8), Tile: vgeo.NewWH[uint8](8, 8),
			Tiles: []vatlas.AnimID{2, 2, 2, 2},
		},
		"mixed": {
			WH: vgeo.NewWH[int32](32, 16), Tile: vgeo.NewWH[uint8](8, 8),
			Tiles: []vatlas.AnimID{1, 1, 0, 0, 0, 3, 1, 1},
		},
		"no repeats": {
			WH: vgeo.NewWH[int32](32, 8), Tile: vgeo.NewWH[uint8](8, 8),
			Tiles: []vatlas.AnimID{1, 2, 3, 4},
		},
		"long run": {
			WH: vgeo.NewWH[int32](256, 1), Tile: vgeo.NewWH[uint8](1, 1),
			Tiles: make([]vatlas.AnimID, 256),
		},
	}
	for name, lvl := range cases {
		t.Run(name, func(t *testing.T) {
			got := DecodeLevel(EncodeLevel(&lvl))
			if len(got.Tiles) == 0 && len(lvl.Tiles) == 0 {
				got.Tiles, lvl.Tiles = nil, nil
			}
			if !reflect.DeepEqual(got, lvl) {
				t.Fatalf("got %v, want %v", got, lvl)
			}
		})
	}
}

func TestLevelRunEncodingLength(t *testing.T) {
	for _, test := range []struct {
		name        string
		count, want int
	}{
		{"short", 255, levelHeaderLen + 3},
		{"long", 256, levelHeaderLen + 5},
	} {
		t.Run(test.name, func(t *testing.T) {
			lvl := Level{
				WH:    vgeo.NewWH(int32(test.count), int32(1)),
				Tile:  vgeo.NewWH[uint8](1, 1),
				Tiles: make([]vatlas.AnimID, test.count),
			}
			if got := len(EncodeLevel(&lvl)); got != test.want {
				t.Fatalf("encoded length = %d, want %d", got, test.want)
			}
		})
	}
}
