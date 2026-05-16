package entdata

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
)

type BallEnt struct {
	Sprite vgfx.Sprite // to-do: separate transform.
	Vel    vmath.XY[float32]
}

func NewBallEnt(rnd func() float32, x, y float32) BallEnt {
	return BallEnt{
		Sprite: vgfx.Sprite{
			XY:     vmath.NewXY(x, y),
			AnimID: uint16(assets.SuperballDefault),
			Z:      uint32(rnd() * 0xffff_ffff),
		},
		Vel: vmath.NewXY(rnd()*4-2, rnd()*4-2),
	}
}
