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
		// to-do: there's only one diameter.
		D: vmath.NewXY(rnd()*4-2, rnd()*4-2),
	}
}
