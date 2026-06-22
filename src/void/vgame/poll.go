package vgame

import (
	"github.com/oidoid/void/src/void/vinput"
	"github.com/oidoid/void/src/void/vmath"
)

type Poll struct {
	InputPoll vinput.InputPoll
	// time since the last frame was _requested_ in milliseconds.
	DeltaMs float64
	// time in milliseconds since page load (performance.now()).
	NowMs      float64
	Canvas     vmath.WH[uint16]
	Fullscreen bool
	_          [7]byte // padding for DrawMs alignment
	DrawMs     float64
}
