package vengine

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
	"github.com/oidoid/void/src/void/vtext"
)

type Game interface {
	Atlas() *vatlas.Atlas
	Beep(Beep)
	DrawAlways() bool
	DrawOnBlur() bool
	SetDrawOnBlur(bool)
	ReqContextLoss()
	ReqFullscreen(FullscreenReq)
	ReqScreenshot()
	SetDrawAlways(bool)
	CanvasPhy() *vgeo.WH[uint16]
	Cursor() *ventities.CursorEnt
	DeltaMs() float64
	DeltaSecs() float64
	Font() *vtext.Font
	Fullscreen() bool
	FullscreenEnabled() bool
	In() *vin.In
	NowMillis() float64
	Time() TimeFormat
	Tick() *Tick
	Layer(vgfx.Layer) *vgfx.LayerConfig
	Board() *vboards.Board
	CamX() float32
	CamY() float32
	Ptrlock() bool
	Random() float32
	ReqUpdateInMillis(uint64)
	UtcMillis() uint64
}
