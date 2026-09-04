package vboards

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

// a board object's creation spec.
type Spawn struct {
	XY      vgeo.XY[float32]
	WH      vgeo.WH[float32]
	Rot     float32 // CCW radians around `XY + WH/2`.
	Z       vgfx.Z
	Tag     vatlas.Tag
	Cel     uint8
	Pal     vatlas.Tag
	Hidden  bool
	FlipX   bool
	FlipY   bool
	Stretch bool
	ZTop    bool
}

func NewSpawn(x, y, w, h, rot float32) Spawn {
	return Spawn{
		XY: vgeo.NewXY(x, y), WH: vgeo.NewWH(w, h), Rot: rot,
	}
}
