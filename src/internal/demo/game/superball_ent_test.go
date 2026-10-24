package game

import (
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
)

func TestSuperballEntHitRequiresOverlap(t *testing.T) {
	for _, test := range []struct {
		name string
		x, y float32
		want bool
	}{
		{"east contact", 20, 10, false},
		{"west contact", 0, 10, false},
		{"north contact", 10, 0, false},
		{"south contact", 10, 20, false},
		{"east corner contact", 20, 20, false},
		{"west corner contact", 0, 0, false},
		{"gap", 20.125, 10, false},
		{"east overlap", 19.875, 10, true},
		{"west overlap", 0.125, 10, true},
		{"north overlap", 10, 0.125, true},
		{"south overlap", 10, 19.875, true},
	} {
		t.Run(test.name, func(t *testing.T) {
			ent := SuperballEnt{
				XY:  vgeo.NewXY[float32](10, 10),
				Vel: vgeo.NewXY[float32](1, 2), Rot: 0.5, RotVel: 1,
			}
			other := SuperballEnt{
				XY:  vgeo.NewXY(test.x, test.y),
				Vel: vgeo.NewXY[float32](-1, -2), Rot: 1, RotVel: -1,
			}
			before, otherBefore := ent, other
			if got := ent.Hit(&other, 10); got != test.want {
				t.Fatalf("Hit() = %v, want %v", got, test.want)
			}
			if !test.want && (ent != before || other != otherBefore) {
				t.Fatal("non-overlapping balls changed position or velocity")
			}
			if test.want && ent.Hit(&other, 10) {
				t.Fatal("resolved balls collided again without movement")
			}
		})
	}
}

func TestSuperballEntHitResolvesOverlap(t *testing.T) {
	for _, test := range []struct {
		name                  string
		otherXY               vgeo.XY[float32]
		wantXY, wantOtherXY   vgeo.XY[float32]
		wantVel, wantOtherVel vgeo.XY[float32]
	}{
		{
			name: "horizontal", otherXY: vgeo.NewXY[float32](19, 10),
			wantXY:       vgeo.NewXY[float32](9.5, 10),
			wantOtherXY:  vgeo.NewXY[float32](19.5, 10),
			wantVel:      vgeo.NewXY[float32](-1, 2),
			wantOtherVel: vgeo.NewXY[float32](1, -2),
		},
		{
			name: "vertical", otherXY: vgeo.NewXY[float32](10, 19),
			wantXY:       vgeo.NewXY[float32](10, 9.5),
			wantOtherXY:  vgeo.NewXY[float32](10, 19.5),
			wantVel:      vgeo.NewXY[float32](1, -2),
			wantOtherVel: vgeo.NewXY[float32](-1, 2),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			ent := SuperballEnt{
				XY: vgeo.NewXY[float32](10, 10), Vel: vgeo.NewXY[float32](1, 2),
			}
			other := SuperballEnt{
				XY: test.otherXY, Vel: vgeo.NewXY[float32](-1, -2),
			}
			if !ent.Hit(&other, 10) {
				t.Fatal("overlapping balls did not collide")
			}
			if ent.XY != test.wantXY || other.XY != test.wantOtherXY ||
				ent.Vel != test.wantVel || other.Vel != test.wantOtherVel {
				t.Fatalf("resolved balls = (%+v, %+v), want positions (%v, %v), velocities (%v, %v)",
					ent, other, test.wantXY, test.wantOtherXY,
					test.wantVel, test.wantOtherVel)
			}
		})
	}
}
