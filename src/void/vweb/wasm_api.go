package vweb

import "github.com/oidoid/void/src/void/vengine"

type WasmAPI interface {
	FramePointer() uintptr
	Update() vengine.LoopState
}
