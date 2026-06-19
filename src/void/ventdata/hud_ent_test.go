package ventdata

import (
	"testing"

	"github.com/oidoid/void/src/void/vmath"
)

func TestHudXY(t *testing.T) {
	cases := []struct {
		name   string
		anchor vmath.CompassDir
		margin int16
		w, h   int16
		wantX  int16
		wantY  int16
	}{
		{"NW", vmath.NW, 2, 10, 8, 2, 2},
		{"NE", vmath.NE, 2, 10, 8, 88, 2},
		{"SW", vmath.SW, 2, 10, 8, 2, 50},
		{"SE", vmath.SE, 2, 10, 8, 88, 50},
		{"N", vmath.N, 2, 10, 8, 45, 2},
		{"S", vmath.S, 2, 10, 8, 45, 50},
		{"E", vmath.E, 2, 10, 8, 88, 26},
		{"W", vmath.W, 2, 10, 8, 2, 26},
		{"Center", vmath.Center, 0, 10, 8, 45, 26},

		// zero margin.
		{"NW no margin", vmath.NW, 0, 10, 8, 0, 0},
		{"SE no margin", vmath.SE, 0, 10, 8, 90, 52},
	}

	var canvas = vmath.WH[uint16]{W: 100, H: 60}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			hud := HUDEnt{
				Anchor: test.anchor,
				Margin: vmath.Border[int16]{
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
