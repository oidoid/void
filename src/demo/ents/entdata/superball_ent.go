package entdata

import (
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
)

type BallEnt struct {
	Sprite vgfx.Sprite // to-do: separate transform.
	Vel    vmath.XY[float32]
}

func NewBallEnt(rnd func() float32, x, y float32) BallEnt {
	sprite := vgfx.Sprite{
		XY:     vmath.NewXY(x, y),
		Z:      uint32(rnd() * 0xffff_ffff),
		Radius: uint8(1 + rnd()*4),
		R:      uint8(rnd() * 256),
		G:      uint8(rnd() * 256),
		B:      uint8(rnd() * 256),
		A:      32 + uint8(rnd()*224),
	}
	if rnd() < 0.01 {
		sprite.Radius += uint8(rnd() * 8)
		if rnd() < 0.01 {
			sprite.Radius += uint8(rnd() * 8)
			if rnd() < 0.01 {
				sprite.Radius += uint8(rnd() * 32)
			}
		}
	}
	return BallEnt{
		Sprite: sprite,
		Vel:    vmath.NewXY(rnd()*4-2, rnd()*4-2),
	}
}
