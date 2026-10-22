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

func TestBoardSetTileAt(t *testing.T) {
	for _, test := range []struct {
		name    string
		xy      vgeo.XY[int32]
		tile    Tile
		index   int
		changed bool
	}{
		{"top left", vgeo.NewXY[int32](0, 0), NewTile(9, true), 0, true},
		{"inside cell", vgeo.NewXY[int32](3, 2), NewTile(9, true), 0, true},
		{"col boundary", vgeo.NewXY[int32](4, 0), NewTile(9, true), 1, true},
		{"row boundary", vgeo.NewXY[int32](0, 3), NewTile(9, true), 4, true},
		{"bottom right", vgeo.NewXY[int32](15, 5), NewTile(9, true), 7, true},
		{"clear", vgeo.NewXY[int32](5, 4), 0, 5, true},
		{"flags only", vgeo.NewXY[int32](4, 0), NewTile(2, true), 1, true},
		{"unchanged", vgeo.NewXY[int32](4, 0), NewTile(2, false), 1, false},
		{"west", vgeo.NewXY[int32](-1, 0), NewTile(9, true), -1, false},
		{"east", vgeo.NewXY[int32](16, 0), NewTile(9, true), -1, false},
		{"north", vgeo.NewXY[int32](0, -1), NewTile(9, true), -1, false},
		{"south", vgeo.NewXY[int32](0, 6), NewTile(9, true), -1, false},
	} {
		t.Run(test.name, func(t *testing.T) {
			board := Board{
				WH: vgeo.NewWH[int32](16, 6), Tile: vgeo.NewWH[uint8](4, 3),
				Tiles: []Tile{1, 2, 3, 4, 5, 6, 7, 8},
			}
			if got := board.SetTileAt(test.xy, test.tile); got != test.changed {
				t.Fatalf("SetTileAt(%v) = %v, want %v", test.xy, got, test.changed)
			}
			wantDirty := vgeo.Box[int32]{}
			if test.changed {
				wantDirty = vgeo.XYWH(test.xy.X/4, test.xy.Y/3, 1, 1)
			}
			if board.Dirty != wantDirty {
				t.Errorf("DirtyBox = %v, want %v", board.Dirty, wantDirty)
			}
			for i, got := range board.Tiles {
				want := Tile(i + 1)
				if i == test.index {
					want = test.tile
				}
				if got != want {
					t.Errorf("Tiles[%v] = %v, want %v", i, got, want)
				}
			}
			if test.index < 0 {
				return
			}
			if got := board.TileAt(test.xy); got != test.tile {
				t.Errorf("TileAt(%v) = %v, want %v", test.xy, got, test.tile)
			}
			box := vgeo.XYWH(float32(test.xy.X), float32(test.xy.Y), 0, 0)
			if board.HitsXY(test.xy) != test.tile.Hits() ||
				board.HitsBox(box) != test.tile.Hits() {
				t.Error("collision queries did not reflect the new tile")
			}
		})
	}
}

func TestBoardDirty(t *testing.T) {
	board := Board{
		WH: vgeo.NewWH[int32](16, 9), Tile: vgeo.NewWH[uint8](4, 3),
		Tiles: make([]Tile, 12),
	}
	for _, test := range []struct {
		name string
		xy   vgeo.XY[int32]
		tile Tile
		want vgeo.Box[int32]
	}{
		{"first", vgeo.NewXY[int32](14, 4), 1, vgeo.XYWH[int32](3, 1, 1, 1)},
		{"same cell", vgeo.NewXY[int32](12, 3), 1, vgeo.XYWH[int32](3, 1, 1, 1)},
		{"northwest", vgeo.NewXY[int32](5, 1), 2, vgeo.XYWH[int32](1, 0, 3, 2)},
		{"southwest", vgeo.NewXY[int32](0, 8), 3, vgeo.XYWH[int32](0, 0, 4, 3)},
		{"clear", vgeo.NewXY[int32](5, 1), 0, vgeo.XYWH[int32](0, 0, 4, 3)},
		{"outside", vgeo.NewXY[int32](-1, 8), 9, vgeo.XYWH[int32](0, 0, 4, 3)},
	} {
		t.Run(test.name, func(t *testing.T) {
			board.SetTileAt(test.xy, test.tile)
			if board.Dirty != test.want {
				t.Fatalf("Dirty = %v, want %v", board.Dirty, test.want)
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
