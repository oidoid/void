// to-do: can we rename package?
package entities

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

type SuperballEnt struct {
	vgeo.XY[float32]
	Vel    vgeo.XY[float32]
	Rot    float32
	RotVel float32
}

const maxRotVel = .2

func NewSuperballEnt(rnd func() float32, xy vgeo.XY[float32]) SuperballEnt {
	vel := vgeo.NewXY(rnd()*4-2, rnd()*4-2)
	rotVel := (rnd()*2 - 1) * maxRotVel
	return SuperballEnt{XY: xy, Vel: vel, RotVel: rotVel}
}

func (this *SuperballEnt) Move(lvl vgeo.Box[float32], radius float32) {
	this.Rot += this.RotVel
	diameter := radius * 2
	this.X += this.Vel.X
	this.Y += this.Vel.Y
	if this.X < lvl.Min.X {
		this.X = lvl.Min.X
		this.Vel.X = -this.Vel.X
	} else if this.X+diameter > lvl.Max.X {
		this.X = lvl.Max.X - diameter
		this.Vel.X = -this.Vel.X
	}
	if this.Y < lvl.Min.Y {
		this.Y = lvl.Min.Y
		this.Vel.Y = -this.Vel.Y
	} else if this.Y+diameter > lvl.Max.Y {
		this.Y = lvl.Max.Y - diameter
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
			AnimCel: assets.SuperballDefault.Cel(0),
			XY:      this.XY,
			Z:       gfx.ZSuperball,
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
