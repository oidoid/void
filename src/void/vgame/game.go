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
	DeltaMs() float64
	Font() *vtext.Font
	Fullscreen() bool
	In() *vinput.In
	NowMs() float64
	Tick() *Tick
	Layer(vgfx.Layer) *vgfx.LayerConfig
	Random() float32
}
