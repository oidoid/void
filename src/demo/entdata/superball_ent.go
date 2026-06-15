// to-do: can we rename package?
package entdata

import (
	"github.com/oidoid/void/src/void/vmath"
)

type BallEnt struct {
	vmath.XY[float32]
	D vmath.XY[float32]
}

func NewBallEnt(rnd func() float32, x, y float32) BallEnt {
	return BallEnt{
		XY: vmath.NewXY(x, y),
		D:  vmath.NewXY(rnd()*4-2, rnd()*4-2),
	}
}

func (this *BallEnt) Update(lvl vmath.Box[float32], radius float32) {
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
