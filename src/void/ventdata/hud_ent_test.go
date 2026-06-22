package ventdata

import (
	"testing"

	"github.com/oidoid/void/src/void/vmath"
)

func TestHudXY(t *testing.T) {
	cases := []struct {
		name   string
		anchor vmath.Dir
		margin int16
		w, h   int16
		wantX  int16
		wantY  int16
	}{
		{"NW", vmath.DirNW, 2, 10, 8, 2, 2},
		{"NE", vmath.DirNE, 2, 10, 8, 88, 2},
		{"SW", vmath.DirSW, 2, 10, 8, 2, 50},
		{"SE", vmath.DirSE, 2, 10, 8, 88, 50},
		{"N", vmath.DirN, 2, 10, 8, 45, 2},
		{"S", vmath.DirS, 2, 10, 8, 45, 50},
		{"E", vmath.DirE, 2, 10, 8, 88, 26},
		{"W", vmath.DirW, 2, 10, 8, 2, 26},
		{"Center", vmath.DirCenter, 0, 10, 8, 45, 26},

		// zero margin.
		{"NW no margin", vmath.DirNW, 0, 10, 8, 0, 0},
		{"SE no margin", vmath.DirSE, 0, 10, 8, 90, 52},
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
