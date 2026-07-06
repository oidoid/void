// to-do: can we rename package?
package entdata

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

type BallEnt struct {
	vgeo.XY[float32]
	D vgeo.XY[float32]
}

func NewBallEnt(rnd func() float32, xy vgeo.XY[float32]) BallEnt {
	return BallEnt{XY: xy, D: vgeo.NewXY(rnd()*4-2, rnd()*4-2)}
}

func (this *BallEnt) Update(
	sprites *[]vgfx.Sprite,
	clip vgeo.Box[float32],
	lvl vgeo.Box[float32],
	radius float32,
) vgame.Status {
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
	if clip.HitsXY(this.XY) {
		*sprites = append(
			*sprites,
			vgfx.Sprite{
				AnimCel: assets.SuperballDefault.Cel(0), XY: this.XY, Z: gfx.ZSuperball,
			},
		)
	}
	return vgame.Loop
}
