package ents

import (
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

type BallEnt struct {
	sprite vvec.Handle
	vel    vmath.XY[float32]
}

func NewBallEnt(balls *vvec.Vec[BallEnt], sprites *vvec.Vec[vgfx.Sprite], rnd func() float32, x, y float32) {
	sprite := vgfx.Sprite{
		X:      x,
		Y:      y,
		Radius: uint8(1 + rnd()*4),
		R:      uint8(rnd() * 256),
		G:      uint8(rnd() * 256),
		B:      uint8(rnd() * 256),
		A:      32 + uint8(rnd()*224),
	}
	spriteHandle := sprites.Add(&sprite)
	ball := BallEnt{
		sprite: spriteHandle,
		vel:    vmath.XY[float32]{X: rnd()*4 - 2, Y: rnd()*4 - 2},
	}
	_ = balls.Add(&ball)
}

func UpdateBalls(balls *vvec.Vec[BallEnt], sprites *vvec.Vec[vgfx.Sprite], minX, minY, maxX, maxY float32) {
	for i := range balls.Vals() {
		ball := &balls.Vals()[i]
		sprite := sprites.Get(ball.sprite)
		ball.update(sprite, minX, minY, maxX, maxY)
	}
}

func (this *BallEnt) update(sprite *vgfx.Sprite, minX, minY, maxX, maxY float32) {
	radius := float32(sprite.Radius)
	sprite.X += this.vel.X
	sprite.Y += this.vel.Y
	if sprite.X-radius < minX {
		sprite.X = minX + radius
		this.vel.X = -this.vel.X
	} else if sprite.X+radius > maxX {
		sprite.X = maxX - radius
		this.vel.X = -this.vel.X
	}
	if sprite.Y-radius < minY {
		sprite.Y = minY + radius
		this.vel.Y = -this.vel.Y
	} else if sprite.Y+radius > maxY {
		sprite.Y = maxY - radius
		this.vel.Y = -this.vel.Y
	}
}
