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
			if got := board.HitsXY(test.xy); got != test.wantHits {
				t.Fatalf("HitsAt(%v) = %v, want %v", test.xy, got, test.wantHits)
			}
		})
	}
}

func TestBoardHitsBox(t *testing.T) {
	board := Board{
		WH:    vgeo.NewWH[int32](20, 15),
		Tile:  vgeo.NewWH[uint8](4, 3),
		Tiles: make([]Tile, 25),
	}
	board.Tiles[0] = NewTile(2, false)
	board.Tiles[2*5+2] = NewTile(1, true)
	for _, test := range []struct {
		name string
		box  vgeo.Box[float32]
		want bool
	}{
		{"non-solid tile", vgeo.XYWH[float32](0, 0, 3, 2), false},
		{"inside solid tile", vgeo.XYWH[float32](8.25, 6.25, 0.5, 0.5), true},
		{"right endpoint", vgeo.XYWH[float32](4, 6, 4, 0), true},
		{"bottom endpoint", vgeo.XYWH[float32](8, 3, 0, 3), true},
		{"before solid tile", vgeo.XYWH[float32](4, 6, 3.75, 0), false},
		{"above solid tile", vgeo.XYWH[float32](8, 3, 0, 2.75), false},
		{"after solid tile", vgeo.XYWH[float32](12, 6, 0, 0), false},
		{"below solid tile", vgeo.XYWH[float32](8, 9, 0, 0), false},
		{"solid tile inside box", vgeo.XYWH[float32](0, 0, 19, 14), true},
		{"solid tile along edge", vgeo.XYWH[float32](0, 6, 19, 0), true},
		{"crossing tile corner", vgeo.XYWH[float32](7.5, 5.5, 1, 1), true},
		{"outside left edge", vgeo.XYWH[float32](-0.25, 0, 0, 0), true},
		{"outside top edge", vgeo.XYWH[float32](0, -0.25, 0, 0), true},
		{"inside right edge", vgeo.XYWH[float32](19.75, 0, 0, 0), false},
		{"inside bottom edge", vgeo.XYWH[float32](0, 14.75, 0, 0), false},
		{"right board edge", vgeo.XYWH[float32](20, 0, 0, 0), true},
		{"bottom board edge", vgeo.XYWH[float32](0, 15, 0, 0), true},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := board.HitsBox(test.box); got != test.want {
				t.Fatalf("HitsBox(%v) = %v, want %v", test.box, got, test.want)
			}
		})
	}
}
