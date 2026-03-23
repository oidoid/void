package void

import "github.com/oidoid/void/src/engine/input"

type Update struct {
	pointer input.PointerPoll
	wheel   input.WheelPoll
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
