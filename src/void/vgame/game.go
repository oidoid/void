package vgame

import (
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vinput"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vtext"
)

type Game interface {
	Platform
	Canvas() *vmath.WH[uint16]
	DrawSprite(sprite *vgfx.Sprite)
	Font() *vtext.Font
	Fullscreen() bool
	Input() *vinput.Input
	NowMs() float64
	Tick() *Tick
	BeginDraw() vgfx.SpriteBatch
	EndDraw(batch vgfx.SpriteBatch)
	Random() float32
}
