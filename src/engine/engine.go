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
	println("hello from Go engine", this.update.X, this.update.Y)
	return Pause
}
