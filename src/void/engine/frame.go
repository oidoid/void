package engine

import "github.com/oidoid/void/src/void/input"

type Frame struct {
	Input input.Input
	// time since the last frame was _requested_ in milliseconds.
	DeltaMs float64
	// time in UTC milliseconds.
	NowMs            float64
	CanvasW, CanvasH uint16
}
