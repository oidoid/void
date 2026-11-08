package veng

import (
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

func TestNinePatchEntMidSize(t *testing.T) {
	for _, test := range []struct {
		name    string
		wh      vgeo.WH[uint16]
		corner  vgeo.WH[uint16]
		wantMid vgeo.WH[uint16]
	}{
		{
			"fits",
			vgeo.NewWH[uint16](10, 8),
			vgeo.NewWH[uint16](2, 3),
			vgeo.NewWH[uint16](6, 2),
		},
		{
			"exact corners",
			vgeo.NewWH[uint16](4, 6),
			vgeo.NewWH[uint16](2, 3),
			vgeo.NewWH[uint16](0, 0),
		},
		{
			"smaller than corners",
			vgeo.NewWH[uint16](2, 2),
			vgeo.NewWH[uint16](4, 4),
			vgeo.NewWH[uint16](0, 0)},
	} {
		t.Run(test.name, func(t *testing.T) {
			ent := NinePatchEnt{WH: test.wh, CornerWH: test.corner}
			var sprs []vgfx.Spr
			ent.Update(&sprs)
			if got := sprs[vgeo.DirCenter].WH; got != test.wantMid {
				t.Errorf("center WH = %v, want %v", got, test.wantMid)
			}
			if got := sprs[vgeo.DirN].WH.W; got != test.wantMid.W {
				t.Errorf("north W = %d, want %d", got, test.wantMid.W)
			}
			if got := sprs[vgeo.DirW].WH.H; got != test.wantMid.H {
				t.Errorf("west H = %d, want %d", got, test.wantMid.H)
			}
		})
	}
}
