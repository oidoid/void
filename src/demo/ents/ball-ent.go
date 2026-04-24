package ents

import (
	"github.com/oidoid/void/src/demo/game"
	"github.com/oidoid/void/src/void/vgfx"
)

type Vel struct{ X, Y float32 }

type BallEnt[Game game.Game] struct {
	sprite *vgfx.Sprite
	vel    Vel
}

func NewBallEnt[Game game.Game](game Game, x, y float32) *BallEnt[Game] {
	sprite := game.Balls().Alloc()
	*sprite = vgfx.Sprite{
		X:      x,
		Y:      y,
		Radius: uint8(game.Random()*3 + 8),
		R:      uint8(game.Random() * 256),
		G:      uint8(game.Random() * 256),
		B:      uint8(game.Random() * 256),
		A:      255,
	}
	return &BallEnt[Game]{
		sprite: sprite,
		vel: Vel{
			X: game.Random()*4 - 2,
			Y: game.Random()*4 - 2,
		},
	}
}

func (this *BallEnt[Game]) Update(game Game) {
	minX := float32(game.LevelX())
	minY := float32(game.LevelY())
	maxX := minX + float32(game.LevelW())
	maxY := minY + float32(game.LevelH())
	radius := float32(this.sprite.Radius)
	this.sprite.X += this.vel.X
	this.sprite.Y += this.vel.Y
	if this.sprite.X-radius < minX {
		this.sprite.X = minX + radius
		this.vel.X = -this.vel.X
	} else if this.sprite.X+radius > maxX {
		this.sprite.X = maxX - radius
		this.vel.X = -this.vel.X
	}
	if this.sprite.Y-radius < minY {
		this.sprite.Y = minY + radius
		this.vel.Y = -this.vel.Y
	} else if this.sprite.Y+radius > maxY {
		this.sprite.Y = maxY - radius
		this.vel.Y = -this.vel.Y
	}
}
