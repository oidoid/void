package ents

import (
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

// const maxBallWallHits = 3

type BallEnt struct {
	// handle vvec.Handle
	sprite vvec.Handle
	vel    vmath.XY[float32]
	// hits   uint8
}

func NewBallEnt(balls *vvec.Vec[BallEnt], sprites *vvec.Vec[vgfx.Sprite], rnd func() float32, x, y float32) {
	sprite := vgfx.Sprite{
		X:      x,
		Y:      y,
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
				sprite.Radius += uint8(rnd() * 8)
				if rnd() < 0.01 {
					sprite.Radius += uint8(rnd() * 32)
				}
			}
		}
	}
	spriteHandle := sprites.Add(&sprite)
	ball := BallEnt{
		sprite: spriteHandle,
		vel:    vmath.XY[float32]{X: rnd()*4 - 2, Y: rnd()*4 - 2},
	}
	_ = balls.Add(&ball)
	// balls.Get(ballHandle).handle = ballHandle
}

func UpdateBalls(balls *vvec.Vec[BallEnt], sprites *vvec.Vec[vgfx.Sprite], minX, minY, maxX, maxY float32) {
	for i := 0; i < balls.Len(); {
		ball := &balls.Vals()[i]
		sprite := sprites.Get(ball.sprite)
		ball.update(sprite, minX, minY, maxX, maxY)
		// if ball.update(sprite, minX, minY, maxX, maxY) {
		// 	sprites.Free(ball.sprite)
		// 	balls.Free(ball.handle)
		// 	continue
		// }
		i++
	}
}

func (this *BallEnt) update(sprite *vgfx.Sprite, minX, minY, maxX, maxY float32) bool {
	radius := float32(sprite.Radius)
	sprite.X += this.vel.X
	sprite.Y += this.vel.Y
	if sprite.X-radius < minX {
		sprite.X = minX + radius
		this.vel.X = -this.vel.X
		// this.hits++
	} else if sprite.X+radius > maxX {
		sprite.X = maxX - radius
		this.vel.X = -this.vel.X
		// this.hits++
	}
	if sprite.Y-radius < minY {
		sprite.Y = minY + radius
		this.vel.Y = -this.vel.Y
		// this.hits++
	} else if sprite.Y+radius > maxY {
		sprite.Y = maxY - radius
		this.vel.Y = -this.vel.Y
		// this.hits++
	}
	// return this.hits >= maxBallWallHits
	return false
}
