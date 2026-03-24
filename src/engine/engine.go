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
	for _, pointer := range this.update.Input.Pointers[:this.update.Input.PointersLen] {
		println("pointer", pointer.ID, pointer.X, pointer.Y, pointer.Buttons)
	}
	println("wheel", this.update.Input.Wheel.DeltaX, this.update.Input.Wheel.DeltaY, this.update.Input.Wheel.DeltaZ)
	for _, gamepad := range this.update.Input.Gamepads[:this.update.Input.GamepadsLen] {
		println("gamepad", gamepad.Index, gamepad.Buttons, gamepad.Axes[0], gamepad.Axes[1])
	}
	return Pause
}
