package vgame

import (
	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
	"github.com/oidoid/void/src/void/vtext"
)

type Game interface {
	Beep(Beep)
	Platform
	DrawAlways() bool
	RequestContextLoss()
	RequestFullscreen(bool)
	RequestScreenshot()
	SetDrawAlways(bool)
	DisableFullscreen(bool)
	DisableWakelock(bool)
	CanvasPhy() *vgeo.WH[uint16]
	CursorPhy() *vgeo.Box[float32]
	DeltaMs() float64
	DeltaSecs() float64
	Font() *vtext.Font
	Fullscreen() bool
	FullscreenDisabled() bool
	Wakelock() bool
	WakelockDisabled() bool
	In() *vin.In
	NowMillis() float64
	Time() TimeFormat
	Tick() *Tick
	Layer(vgfx.Layer) *vgfx.LayerConfig
	Board() *vboards.Board
	CamX() float32
	CamY() float32
	Pointerlock() bool
	Random() float32
	RequestUpdateInMillis(uint64)
	UtcMillis() uint64
}
