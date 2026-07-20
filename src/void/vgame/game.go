package vgame

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
	"github.com/oidoid/void/src/void/vtext"
)

type Game interface {
	Platform
	DrawAlways() bool
	RequestContextLoss()
	RequestFullscreen(bool)
	RequestScreenshot()
	SetDrawAlways(bool)
	CanvasPhy() *vgeo.WH[uint16]
	DeltaMs() float64
	Font() *vtext.Font
	Fullscreen() bool
	In() *vin.In
	NowMillis() float64
	Time() TimeFormat
	Tick() *Tick
	Layer(vgfx.Layer) *vgfx.LayerConfig
	Random() float32
}
