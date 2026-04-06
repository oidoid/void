package void

import "github.com/oidoid/void/src/engine/input"

type Update struct {
	Input input.Input
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
