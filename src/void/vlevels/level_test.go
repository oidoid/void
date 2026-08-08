package vlevels

import (
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
)

func TestLevelTileAt(t *testing.T) {
	level := Level{
		Box:   vgeo.XYWH[int32](-8, -4, 16, 8),
		Tile:  vgeo.NewWH[uint8](4, 4),
		Tiles: []vatlas.AnimID{1, 2, 3, 4, 5, 6, 7, 8},
	}
	cases := []struct {
		name string
		xy   vgeo.XY[int32]
		want vatlas.AnimID
	}{
		{"top left", vgeo.NewXY[int32](-8, -4), 1},
		{"top right", vgeo.NewXY[int32](7, -4), 4},
		{"bottom left", vgeo.NewXY[int32](-8, 3), 5},
		{"bottom right", vgeo.NewXY[int32](7, 3), 8},
		{"west", vgeo.NewXY[int32](-9, -4), 0},
		{"east", vgeo.NewXY[int32](8, -4), 0},
		{"north", vgeo.NewXY[int32](-8, -5), 0},
		{"south", vgeo.NewXY[int32](-8, 4), 0},
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
