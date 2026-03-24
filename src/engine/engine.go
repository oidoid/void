package void

import (
	"unsafe"
)

type Engine struct {
	update Update
}

var _ WasmAPI = (*Engine)(nil)

func (this *Engine) GetUpdatePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.update))
}

func (this *Engine) Update() LoopState {
	for _, pointer := range this.update.pointers[:this.update.pointersLen] {
		println("pointer", pointer.ID, pointer.X, pointer.Y, pointer.Buttons)
	}
	println("wheel", this.update.wheel.DeltaX, this.update.wheel.DeltaY, this.update.wheel.DeltaZ)
	return Pause
}
