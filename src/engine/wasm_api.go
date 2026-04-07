package void

import "github.com/oidoid/void/src/engine/input"

type Update struct {
	Input input.Input
	// time since the last frame was _requested_ in milliseconds.
	DeltaMs float64
	// time in UTC milliseconds.
	NowMs float64
}

type LoopState uint8

const (
	Pause LoopState = iota
	Loop
)

type WasmAPI interface {
	GetSpriteCount() uint32
	GetSpritePointer() uintptr
	GetUpdatePointer() uintptr
	SetCanvasWH(w, h int32)
	Update() LoopState
}
