package vengine

import (
	"github.com/oidoid/void/src/void/vinput"
	"github.com/oidoid/void/src/void/vmath"
)

type Frame struct {
	Input vinput.Input
	// time since the last frame was _requested_ in milliseconds.
	DeltaMs float64
	// time in UTC milliseconds.
	NowMs  float64
	Canvas vmath.WH[uint16]
}
