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
	Font() *vtext.Font
	Fullscreen() bool
	Input() *vinput.InputPoll
	NowMs() float64
	Tick() *Tick
	Sprites() *[]vgfx.Sprite
	Viewport() vmath.Box[float32]
	Random() float32
}
