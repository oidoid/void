package vboards

import (
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
)

func TestBoardTileAt(t *testing.T) {
	board := Board{
		WH:   vgeo.NewWH[int32](16, 8),
		Tile: vgeo.NewWH[uint8](4, 4),
		Tiles: []Tile{
			NewTile(1, false), NewTile(2, true), NewTile(3, false),
			NewTile(4, false), NewTile(5, false), NewTile(6, false),
			NewTile(7, true), NewTile(8, false),
		},
	}
	cases := []struct {
		name     string
		xy       vgeo.XY[int32]
		wantTag  vatlas.Tag
		wantHits bool
	}{
		{"top left", vgeo.NewXY[int32](0, 0), 1, false},
		{"hit", vgeo.NewXY[int32](4, 0), 2, true},
		{"top right", vgeo.NewXY[int32](15, 0), 4, false},
		{"bottom left", vgeo.NewXY[int32](0, 7), 5, false},
		{"bottom hit", vgeo.NewXY[int32](8, 7), 7, true},
		{"bottom right", vgeo.NewXY[int32](15, 7), 8, false},
		{"west", vgeo.NewXY[int32](-1, 0), 0, false},
		{"east", vgeo.NewXY[int32](16, 0), 0, false},
		{"north", vgeo.NewXY[int32](0, -1), 0, false},
		{"south", vgeo.NewXY[int32](0, 8), 0, false},
	}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			if got := board.TileAt(test.xy).Tag(); got != test.wantTag {
				t.Fatalf("TileAt(%v) = %v, want %v", test.xy, got, test.wantTag)
			}
			if got := board.HitsAt(test.xy); got != test.wantHits {
				t.Fatalf("HitsAt(%v) = %v, want %v", test.xy, got, test.wantHits)
			}
		})
	}
}
