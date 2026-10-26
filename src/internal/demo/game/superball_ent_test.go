package game

import (
	"testing"

	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgrid"
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
		{"rounded east contact", 19.51, 10, false},
		{"rounded west contact", 0.49, 10, false},
		{"rounded north contact", 10, 0.49, false},
		{"rounded south contact", 10, 19.51, false},
		{"east overlap", 19.49, 10, true},
		{"west overlap", 0.51, 10, true},
		{"north overlap", 10, 0.51, true},
		{"south overlap", 10, 19.49, true},
	} {
		t.Run(test.name, func(t *testing.T) {
			ent := SuperballEnt{
				XY:  vgeo.NewXY[float32](10.25, 10.25),
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

func TestSuperballEntPixelBoardContact(t *testing.T) {
	board := vgeo.NewBox[float32](0, 0, 26, 26)
	ent := SuperballEnt{
		XY: vgeo.NewXY[float32](25.25, 10.25), Vel: vgeo.NewXY[float32](1, 0),
	}
	ent.Move(.125, board)
	if ent.X != 25.375 || ent.Vel.X != 1 {
		t.Fatalf("unobstructed subpixel movement changed: %+v", ent)
	}
	ent.X = 26.25
	ent.Move(.125, board)
	if ent.X != 26.375 || ent.Vel.X != 1 {
		t.Fatalf("drawn edge contact bounced: %+v", ent)
	}
	ent.Move(.25, board)
	if ent.X != 26 || ent.Vel.X != -1 {
		t.Fatalf("drawn board overlap did not stop and bounce: %+v", ent)
	}
}

func TestSuperballGridUsesDrawnOrigins(t *testing.T) {
	for _, test := range []struct {
		otherX float32
		want   int
	}{
		{30.25, 1}, {30.51, 0},
	} {
		ents := []SuperballEnt{
			{XY: vgeo.NewXY[float32](25.25, 10)},
			{XY: vgeo.NewXY(test.otherX, float32(10))},
		}
		grid := vgrid.New(vgeo.NewBox[float32](0, 0, 30, 30), 6, 2)
		beeps := 0
		nearbox := vgeo.NewBox[float32](-10, -10, 50, 50)
		hitSuperballs(ents, &grid, true, func(float32, float32) { beeps++ },
			nearbox, 6)
		if beeps != test.want {
			t.Fatalf("other X=%v: collisions=%d, want %d", test.otherX, beeps, test.want)
		}
		if test.want != 0 && ents[0].Hit(&ents[1], 6) {
			t.Fatal("grid collision left overlapping drawn bounds")
		}
	}
}

func TestSuperballDrawIncludesRotatedEdges(t *testing.T) {
	gam := NewGame()
	gam.Superballs.Clear()
	layer := gam.Layer(gfx.LayerSuperballs)
	layer.Clip = vgeo.XYWH[float32](100, 100, 10, 10)
	gam.Superballs.Add(SuperballEnt{
		XY: vgeo.NewXY[float32](91, 100), Rot: 0.7853982,
	})
	gam.Superballs.Update(gam)
	if len(layer.Sprs) != 1 {
		t.Fatal("rotated sprite visible at the clip edge was culled")
	}
}
