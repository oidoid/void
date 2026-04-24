package ents

import (
	"github.com/oidoid/void/src/void/ents"
	"github.com/oidoid/void/src/void/gfx"
	"github.com/oidoid/void/src/void/math"
)

type Vel struct{ X, Y float32 }

type BallEnt struct {
	sprite *gfx.Sprite
	vel    Vel
}

func NewBallEnt(zoo *ents.Zoo, rnd *math.Random, x, y float32) *BallEnt {
	sprite := zoo.Alloc()
	*sprite = gfx.Sprite{
		X:      x,
		Y:      y,
		Radius: uint8(rnd.Float64()*3 + 8),
		R:      uint8(rnd.Float64() * 256),
		G:      uint8(rnd.Float64() * 256),
		B:      uint8(rnd.Float64() * 256),
		A:      255,
	}
	return &BallEnt{
		sprite: sprite,
		vel: Vel{
			X: float32(rnd.Float64()*4 - 2),
			Y: float32(rnd.Float64()*4 - 2),
		},
	}
}

func (this *BallEnt) Update(w, h int) {
	radius := float32(this.sprite.Radius)
	this.sprite.X += this.vel.X
	this.sprite.Y += this.vel.Y
	if this.sprite.X-radius < 0 {
		this.sprite.X = radius
		this.vel.X = -this.vel.X
	} else if this.sprite.X+radius > float32(w) {
		this.sprite.X = float32(w) - radius
		this.vel.X = -this.vel.X
	}
	if this.sprite.Y-radius < 0 {
		this.sprite.Y = radius
		this.vel.Y = -this.vel.Y
	} else if this.sprite.Y+radius > float32(h) {
		this.sprite.Y = float32(h) - radius
		this.vel.Y = -this.vel.Y
	}
}
