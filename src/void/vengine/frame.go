package vengine

import "github.com/oidoid/void/src/void/vinput"

type Frame struct {
	Input vinput.Input
	// time since the last frame was _requested_ in milliseconds.
	DeltaMs float64
	// time in UTC milliseconds.
	NowMs            float64
	CanvasW, CanvasH uint16
}
