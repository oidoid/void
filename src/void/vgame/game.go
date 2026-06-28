package vgame

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vinput"
	"github.com/oidoid/void/src/void/vtext"
)

type Game interface {
	Platform
	CanvasPhy() *vgeo.WH[uint16]
	Font() *vtext.Font
	Fullscreen() bool
	In() *vinput.In
	NowMs() float64
	Tick() *Tick
	Sprites() *[]vgfx.Sprite
	Viewport() vgeo.Box[float32]
	Random() float32
}
