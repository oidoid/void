// to-do: can we rename package?
package entities

import (
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/demo/tags"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

type SuperballEnt struct {
	vgeo.XY[float32]
	Vel    vgeo.XY[float32] // px / sec.
	Rot    float32          // radians.
	RotVel float32          // radians / sec.
}

const (
	superballMaxVel    = float32(120)
	superballMaxRotVel = float32(12)
)

func NewSuperballEnt(rnd func() float32, xy vgeo.XY[float32]) SuperballEnt {
	vel := vgeo.NewXY(
		(rnd()*2-1)*superballMaxVel,
		(rnd()*2-1)*superballMaxVel,
	)
	rotVel := (rnd()*2 - 1) * superballMaxRotVel
	return SuperballEnt{XY: xy, Vel: vel, RotVel: rotVel}
}

func (this *SuperballEnt) Move(
	deltaSec float32,
	board vgeo.Box[float32],
	radius float32,
) {
	this.Rot += this.RotVel * deltaSec
	diameter := radius * 2
	this.X += this.Vel.X * deltaSec
	this.Y += this.Vel.Y * deltaSec
	if this.X < board.Min.X {
		this.X = board.Min.X
		this.Vel.X = -this.Vel.X
	} else if this.X+diameter > board.Max.X {
		this.X = board.Max.X - diameter
		this.Vel.X = -this.Vel.X
	}
	if this.Y < board.Min.Y {
		this.Y = board.Min.Y
		this.Vel.Y = -this.Vel.Y
	} else if this.Y+diameter > board.Max.Y {
		this.Y = board.Max.Y - diameter
		this.Vel.Y = -this.Vel.Y
	}
}

// to-do: make all other ents follow Update / Draw / Hit() pattern.
func (this *SuperballEnt) Draw(
	sprs *[]vgfx.Spr,
	clip vgeo.Box[float32],
) vgame.Status {
	if clip.HitsXY(this.XY) {
		spr := vgfx.Spr{
			TagCel: tags.SuperballDefault.Cel(0),
			XY:     this.XY,
			Z:      gfx.ZSuperball,
		}
		spr.SetRot(this.Rot)
		*sprs = append(*sprs, spr)
	}
	return vgame.Pause // demo doesn't want superballs to require updates.
}

func (this *SuperballEnt) Hit(other *SuperballEnt, diameter float32) bool {
	dx := other.X - this.X
	if dx < 0 {
		dx = -dx
	}
	dx = diameter - dx
	if dx <= 0 {
		return false
	}
	dy := other.Y - this.Y
	if dy < 0 {
		dy = -dy
	}
	dy = diameter - dy
	if dy <= 0 {
		return false
	}
	if dx < dy {
		dir := float32(1)
		if other.X < this.X {
			dir = -1
		}
		this.X -= dir * dx / 2
		other.X += dir * dx / 2
		if dir*(other.Vel.X-this.Vel.X) < 0 {
			this.Vel.X, other.Vel.X = other.Vel.X, this.Vel.X
		}
	} else {
		dir := float32(1)
		if other.Y < this.Y {
			dir = -1
		}
		this.Y -= dir * dy / 2
		other.Y += dir * dy / 2
		if dir*(other.Vel.Y-this.Vel.Y) < 0 {
			this.Vel.Y, other.Vel.Y = other.Vel.Y, this.Vel.Y
		}
	}
	return true
}
