package vboards

import (
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

func TestSpawnSpr(t *testing.T) {
	spawn := Spawn{
		XY:      vgeo.NewXY[float32](1, 2),
		WH:      vgeo.NewWH[float32](3.1, 4.1),
		Rot:     .5,
		Z:       vgfx.Z(5),
		Tag:     6,
		Cel:     7,
		Pal:     8,
		Hidden:  true,
		FlipX:   true,
		FlipY:   true,
		Stretch: true,
		ZTop:    true,
	}
	spr := spawn.Spr()
	if spr.XY != spawn.XY || spr.WH != vgeo.NewWH[uint16](4, 5) {
		t.Errorf("spr = %#v, want XY (1,2), WH (4,5)", spr)
	}
	if spr.Tag() != 6 || spr.Cel() != 7 || spr.Pal() != 8 || spr.Z != 5 {
		t.Errorf("spr = %#v, want tag 6, cel 7, pal 8, Z 5", spr)
	}
	if !spr.Hidden() || !spr.FlipX() || !spr.FlipY() ||
		!spr.Stretch() || !spr.ZTop() || spr.Rot() == 0 {
		t.Errorf("spr flags = %#v, want spawn flags and rotation", spr)
	}
}
