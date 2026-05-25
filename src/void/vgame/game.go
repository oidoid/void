package vgame

import (
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vinput"
	"github.com/oidoid/void/src/void/vtext"
)

type Game interface {
	Platform
	DrawSprite(sprite *vgfx.Sprite)
	Font() *vtext.Font
	Input() *vinput.Input
	BeginDraw() vgfx.SpriteBatch
	EndDraw(batch vgfx.SpriteBatch)
	Random() float32
}
