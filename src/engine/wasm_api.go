package void

import "github.com/oidoid/void/src/engine/input"

type Update struct {
	pointer input.PointerEvent
	wheel   input.WheelEvent
}

type LoopState uint8

const (
	Pause LoopState = iota
	Loop
)

type WasmAPI interface {
	GetUpdatePointer() uintptr
	Update() LoopState
}
