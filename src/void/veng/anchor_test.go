package veng

import (
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
)

func TestAnchorEntXY(t *testing.T) {
	box := vgeo.XYWH[float32](10, 20, 8, 8)
	noMargin := vgeo.XY[float32]{}
	margin := vgeo.NewXY[float32](2, 3)

	cases := []struct {
		name   string
		dir    vgeo.Dir
		margin vgeo.XY[float32]
		wantX  float32
		wantY  float32
	}{
		{"E", vgeo.DirE, noMargin, 18, 22},
		{"NE", vgeo.DirNE, noMargin, 18, 16},
		{"N", vgeo.DirN, noMargin, 12, 16},
		{"NW", vgeo.DirNW, noMargin, 6, 16},
		{"W", vgeo.DirW, noMargin, 6, 22},
		{"SW", vgeo.DirSW, noMargin, 6, 28},
		{"S", vgeo.DirS, noMargin, 12, 28},
		{"SE", vgeo.DirSE, noMargin, 18, 28},
		{"Center", vgeo.DirCenter, noMargin, 12, 22},
		{"E+margin", vgeo.DirE, margin, 20, 22},
		{"NE+margin", vgeo.DirNE, margin, 20, 13},
		{"N+margin", vgeo.DirN, margin, 12, 13},
		{"NW+margin", vgeo.DirNW, margin, 4, 13},
		{"W+margin", vgeo.DirW, margin, 4, 22},
		{"SW+margin", vgeo.DirSW, margin, 4, 31},
		{"S+margin", vgeo.DirS, margin, 12, 31},
		{"SE+margin", vgeo.DirSE, margin, 20, 31},
		{"Center+margin", vgeo.DirCenter, margin, 12, 22},
	}

	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			anchor := AnchorEnt{
				Dir: test.dir, Margin: test.margin,
				Ref: func() vgeo.Box[float32] { return box },
			}
			got := anchor.XY(4, 4)
			if got.X != test.wantX || got.Y != test.wantY {
				t.Fatalf(
					"got (%v,%v), want (%v,%v)", got.X, got.Y, test.wantX, test.wantY,
				)
			}
		})
	}
}

func TestAnchorEntXYNoRef(t *testing.T) {
	anchor := AnchorEnt{Dir: vgeo.DirSE, Margin: vgeo.NewXY[float32](1, 2)}
	if got, want := anchor.XY(4, 4), vgeo.NewXY[float32](1, 2); got != want {
		t.Fatalf("got %v, want %v", got, want)
	}
}
