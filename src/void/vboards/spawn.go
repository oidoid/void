package vboards

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
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

func (this Spawn) Spr() vgfx.Spr {
	spr := vgfx.Spr{
		XY:     this.XY,
		TagCel: this.Tag.Cel(this.Cel),
		Z:      this.Z,
		WH: vgeo.NewWH(
			uint16(vmath.Ceil(this.WH.W)),
			uint16(vmath.Ceil(this.WH.H)),
		),
	}
	spr.Hide(this.Hidden)
	spr.SetFlipX(this.FlipX)
	spr.SetFlipY(this.FlipY)
	spr.SetStretch(this.Stretch)
	spr.SetPal(this.Pal)
	spr.SetZTop(this.ZTop)
	spr.SetRot(this.Rot)
	return spr
}
