package ents

import (
	V "github.com/oidoid/void/src/engine"
	// to-do: rename package void.
)

type Vel struct{ X, Y float32 }

type BallEnt struct {
	sprite V.Sprite
	vel    Vel
}

// to-do: use zoo.
type BallPool struct {
	pool  [V.MaxSprites]BallEnt
	count int
}

func (p *BallPool) New(rnd *V.Random, x, y float32) *BallEnt {
	if p.count >= len(p.pool) {
		return nil
	}
	b := &p.pool[p.count]
	p.count++
	*b = BallEnt{
		sprite: V.Sprite{
			X:      x,
			Y:      y,
			Radius: uint8(rnd.Float64()*3 + 8),
			R:      uint8(rnd.Float64() * 256),
			G:      uint8(rnd.Float64() * 256),
			B:      uint8(rnd.Float64() * 256),
			A:      255,
		},
		vel: Vel{
			X: float32(rnd.Float64()*4 - 2),
			Y: float32(rnd.Float64()*4 - 2),
		},
	}
	return b
}

func (this *BallEnt) Sprite() V.Sprite { return this.sprite }

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
