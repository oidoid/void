package vgame

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vin"
)

type Poll struct {
	InputPoll vin.InputPoll
	// time since the last frame was _requested_ in milliseconds.
	DeltaMs float64
	// time in milliseconds since page load (performance.now()).
	NowMs      float64
	CanvasPhy  vgeo.WH[uint16]
	Fullscreen bool
	_          [3]byte
	DrawMs     float64
	// number of renderer clears completed.
	DrawCount int32
	_         [4]byte
	// duration of the previous Go update call in milliseconds.
	UpdateMs         float64
	DevicePixelRatio float64
}
