package ents

import (
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

// const maxBallWallHits = 3

type BallEnt struct {
	// handle vvec.Handle
	sprite vgfx.Sprite // to-do: separate transform.
	vel    vmath.XY[float32]
	// hits   uint8
}

func NewBallEnt(balls *vvec.Vec[BallEnt], rnd func() float32, x, y float32) {
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
	ball := BallEnt{
		sprite: sprite,
		vel:    vmath.XY[float32]{X: rnd()*4 - 2, Y: rnd()*4 - 2},
	}
	_ = balls.Add(&ball)
	// balls.Get(ballHandle).handle = ballHandle
}

func UpdateBalls(balls *vvec.Vec[BallEnt], sprites *vvec.Vec[vgfx.Sprite], minX, minY, maxX, maxY, vpMinX, vpMinY, vpMaxX, vpMaxY float32) {
	for i := 0; i < balls.Len(); {
		ball := &balls.Vals()[i]
		ball.update(minX, minY, maxX, maxY)
		if ball.sprite.X >= vpMinX && ball.sprite.X <= vpMaxX &&
			ball.sprite.Y >= vpMinY && ball.sprite.Y <= vpMaxY {
			sprites.Add(&ball.sprite)
		}
		// if ball.update(minX, minY, maxX, maxY) {
		// 	balls.Free(ball.handle)
		// 	continue
		// }
		i++
	}
}

func (this *BallEnt) update(minX, minY, maxX, maxY float32) bool {
	radius := float32(this.sprite.Radius)
	this.sprite.X += this.vel.X
	this.sprite.Y += this.vel.Y
	if this.sprite.X-radius < minX {
		this.sprite.X = minX + radius
		this.vel.X = -this.vel.X
		// this.hits++
	} else if this.sprite.X+radius > maxX {
		this.sprite.X = maxX - radius
		this.vel.X = -this.vel.X
		// this.hits++
	}
	if this.sprite.Y-radius < minY {
		this.sprite.Y = minY + radius
		this.vel.Y = -this.vel.Y
		// this.hits++
	} else if this.sprite.Y+radius > maxY {
		this.sprite.Y = maxY - radius
		this.vel.Y = -this.vel.Y
		// this.hits++
	}
	// return this.hits >= maxBallWallHits
	return false
}
