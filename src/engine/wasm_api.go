package void

import "github.com/oidoid/void/src/engine/input"

const MaxPointers uint8 = 5

type Update struct {
	pointersLen uint8
	pointers    [MaxPointers]input.PointerPoll
	wheel       input.WheelPoll
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
