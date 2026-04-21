package web

import "github.com/oidoid/void/src/void/engine"

type WasmAPI interface {
	FramePointer() uintptr
	Update() engine.LoopState
}
