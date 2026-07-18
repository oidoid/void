// to-do: can we rename package?
package entities

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

// to-do: rename.
type BallEnt struct {
	vgeo.XY[float32]
	D vgeo.XY[float32]
}

func NewBallEnt(rnd func() float32, xy vgeo.XY[float32]) BallEnt {
	return BallEnt{XY: xy, D: vgeo.NewXY(rnd()*4-2, rnd()*4-2)}
}

func (this *BallEnt) Move(lvl vgeo.Box[float32], radius float32) {
	diameter := radius * 2
	this.X += this.D.X
	this.Y += this.D.Y
	if this.X < lvl.Min.X {
		this.X = lvl.Min.X
		this.D.X = -this.D.X
	} else if this.X+diameter > lvl.Max.X {
		this.X = lvl.Max.X - diameter
		this.D.X = -this.D.X
	}
	if this.Y < lvl.Min.Y {
		this.Y = lvl.Min.Y
		this.D.Y = -this.D.Y
	} else if this.Y+diameter > lvl.Max.Y {
		this.Y = lvl.Max.Y - diameter
		this.D.Y = -this.D.Y
	}
}

// to-do: make all other ents follow Update / Draw / Hit() pattern.
func (this *BallEnt) Draw(
	sprites *[]vgfx.Sprite,
	clip vgeo.Box[float32],
) vgame.Status {
	if clip.HitsXY(this.XY) {
		*sprites = append(
			*sprites,
			vgfx.Sprite{
				AnimCel: assets.SuperballDefault.Cel(0), XY: this.XY, Z: gfx.ZSuperball,
			},
		)
	}
	return vgame.Pause // demo doesn't want superballs to require updates.
}

func (this *BallEnt) Hit(other *BallEnt, diameter float32) bool {
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
		if dir*(other.D.X-this.D.X) < 0 {
			this.D.X, other.D.X = other.D.X, this.D.X
		}
	} else {
		dir := float32(1)
		if other.Y < this.Y {
			dir = -1
		}
		this.Y -= dir * dy / 2
		other.Y += dir * dy / 2
		if dir*(other.D.Y-this.D.Y) < 0 {
			this.D.Y, other.D.Y = other.D.Y, this.D.Y
		}
	}
	return true
}
