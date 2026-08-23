package vlevels

import (
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
)

func TestLevelTileAt(t *testing.T) {
	level := Level{
		WH:    vgeo.NewWH[int32](16, 8),
		Tile:  vgeo.NewWH[uint8](4, 4),
		Tiles: []vatlas.Tag{1, 2, 3, 4, 5, 6, 7, 8},
	}
	cases := []struct {
		name string
		xy   vgeo.XY[int32]
		want vatlas.Tag
	}{
		{"top left", vgeo.NewXY[int32](0, 0), 1},
		{"top right", vgeo.NewXY[int32](15, 0), 4},
		{"bottom left", vgeo.NewXY[int32](0, 7), 5},
		{"bottom right", vgeo.NewXY[int32](15, 7), 8},
		{"west", vgeo.NewXY[int32](-1, 0), 0},
		{"east", vgeo.NewXY[int32](16, 0), 0},
		{"north", vgeo.NewXY[int32](0, -1), 0},
		{"south", vgeo.NewXY[int32](0, 8), 0},
	}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			got := level.TileAt(test.xy)
			if got != test.want {
				t.Fatalf("TileAt(%v) = %v, want %v", test.xy, got, test.want)
			}
		})
	}
}
