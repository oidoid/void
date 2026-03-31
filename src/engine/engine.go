package void

import (
	"unsafe"

	"math/rand/v2"

	"github.com/oidoid/void/src/engine/input"
)

type Engine struct {
	update Update
}

var _ WasmAPI = (*Engine)(nil)

func (this *Engine) GetUpdatePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.update))
}

var rnd = rand.New(rand.NewPCG(rand.Uint64(), rand.Uint64()))

func (this *Engine) Update() LoopState {
	var loop = Pause
	for _, pointer := range this.update.Input.Pointers[:this.update.Input.PointersLen] {
		println("pointer", pointer.ID, int(pointer.X), int(pointer.Y), pointer.Buttons)
		if pointer.Buttons != 0 {
			loop = Loop
		}
	}
	if this.update.Input.Wheel.DeltaX != 0 || this.update.Input.Wheel.DeltaY != 0 || this.update.Input.Wheel.DeltaZ != 0 {
		println("wheel", this.update.Input.Wheel.DeltaX, this.update.Input.Wheel.DeltaY, this.update.Input.Wheel.DeltaZ, rnd.Int())
	}
	for _, gamepad := range this.update.Input.Gamepads[:this.update.Input.GamepadsLen] {
		println("gamepad", gamepad.Index, gamepad.Buttons, gamepad.Axes[0], gamepad.Axes[1])
		if gamepad.Buttons != 0 {
			loop = Loop
		}
	}
	kbd := &this.update.Input.Keyboard
	for bit := input.Key(1); bit != 0; bit <<= 1 {
		if kbd.Keys&bit != 0 {
			println("key", bit)
			loop = Loop
		}
	}
	if kbd.TextLen > 0 {
		text := string(kbd.Text[:kbd.TextLen])
		println("text", text)
		if kbd.TextOverflow {
			println("error: text overflow")
		}
		loop = Loop
	}
	return loop
}
