package ventities

import (
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
)

func TestAnchorEntXY(t *testing.T) {
	box := vgeo.XYWH[float32](10, 20, 8, 8)
	noMargin := vgeo.XY[float32]{}

	cases := []struct {
		name   string
		dir    vgeo.Dir
		margin vgeo.XY[float32]
		wantX  float32
		wantY  float32
	}{
		{"W", vgeo.DirW, noMargin, 6, 22},
		{"E", vgeo.DirE, noMargin, 18, 22},
		{"N", vgeo.DirN, noMargin, 12, 16},
		{"S", vgeo.DirS, noMargin, 12, 28},
		{"NW", vgeo.DirNW, noMargin, 10, 16},
		{"NE", vgeo.DirNE, noMargin, 14, 16},
		{"SW", vgeo.DirSW, noMargin, 6, 24},
		{"SE", vgeo.DirSE, noMargin, 18, 24},
		{"Center", vgeo.DirCenter, noMargin, 12, 22},
		{"E+marginX", vgeo.DirE, vgeo.XY[float32]{X: 2}, 20, 22},
		{"N+marginY", vgeo.DirN, vgeo.XY[float32]{Y: 2}, 12, 14},
	}

	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			anchor := AnchorEnt{Dir: test.dir, Margin: test.margin}
			got := anchor.XY(box, 4, 4)
			if got.X != test.wantX || got.Y != test.wantY {
				t.Fatalf(
					"got (%v,%v), want (%v,%v)", got.X, got.Y, test.wantX, test.wantY,
				)
			}
		})
	}
}
