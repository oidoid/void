package vgame

import (
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vinput"
	"github.com/oidoid/void/src/void/vmath"
)

type Game interface {
	Platform
	Frame() *Frame
	Random() float32
	Cam() *vmath.XY[float32]
	Canvas() *vmath.WH[uint16]
	DrawSprite(sprite *vgfx.Sprite)
	Input() *vinput.Input
	LevelBounds() *vmath.Bounds[float32]
	Sprites() *[]vgfx.Sprite
}
