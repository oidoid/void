package ventdata

import (
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
)

func TestHudXY(t *testing.T) {
	cases := []struct {
		name   string
		anchor vgeo.Dir
		margin int16
		w, h   int16
		wantX  int16
		wantY  int16
	}{
		{"NW", vgeo.DirNW, 2, 10, 8, 2, 2},
		{"NE", vgeo.DirNE, 2, 10, 8, 88, 2},
		{"SW", vgeo.DirSW, 2, 10, 8, 2, 50},
		{"SE", vgeo.DirSE, 2, 10, 8, 88, 50},
		{"N", vgeo.DirN, 2, 10, 8, 45, 2},
		{"S", vgeo.DirS, 2, 10, 8, 45, 50},
		{"E", vgeo.DirE, 2, 10, 8, 88, 26},
		{"W", vgeo.DirW, 2, 10, 8, 2, 26},
		{"Center", vgeo.DirCenter, 0, 10, 8, 45, 26},

		// zero margin.
		{"NW no margin", vgeo.DirNW, 0, 10, 8, 0, 0},
		{"SE no margin", vgeo.DirSE, 0, 10, 8, 90, 52},
	}

	var canvas = vgeo.WH[uint16]{W: 100, H: 60}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			hud := HUDEnt{
				Anchor: test.anchor,
				Margin: vgeo.Border[int16]{
					N: test.margin, E: test.margin, S: test.margin, W: test.margin,
				},
			}
			got := HudXY(hud, test.w, test.h, canvas)
			if got.X != test.wantX || got.Y != test.wantY {
				t.Fatalf(
					"hudXY(%s) = (%d, %d), want (%d, %d)",
					test.name,
					got.X,
					got.Y,
					test.wantX,
					test.wantY,
				)
			}
		})
	}
}
