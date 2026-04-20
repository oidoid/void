package void

import (
	"unsafe"

	"github.com/oidoid/void/src/engine/geo"
	"github.com/oidoid/void/src/engine/input"
)

var _ WasmAPI = (*Engine)(nil)

type Engine struct {
	frame   Frame
	zoo     Zoo
	Rnd     Random
	Cam     geo.XY[float32]
	CanvasW int32
	CanvasH int32
}

func NewEngine() Engine {
	return Engine{Rnd: newRandom()}
}

func (this *Engine) SpriteCount() uint32 {
	return uint32(this.zoo.count)
}

func (this *Engine) SpritePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.zoo.sprites[0]))
}

func (this *Engine) Frame() *Frame { return &this.frame }

func (this *Engine) FramePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.frame))
}

func (this *Engine) CamX() float32 { return this.Cam.X }
func (this *Engine) CamY() float32 { return this.Cam.Y }

func (this *Engine) Update() LoopState {
	// to-do: moveinto demo and make ball bounds level sized.
	this.zoo.SetSize(int(this.frame.CanvasW), int(this.frame.CanvasH))
	this.zoo.Update()
	loop := Pause
	if this.zoo.count > 0 {
		loop = Loop
	}
	for _, pointer := range this.frame.Input.Pointers[:this.frame.Input.PointersLen] {
		if pointer.Buttons != 0 {
			for range 1000 {
				radius := uint8(this.Rnd.Float64()*3 + 8)
				this.zoo.DrawCircle(pointer.X, pointer.Y, radius,
					float32(this.Rnd.Float64()*4-2), float32(this.Rnd.Float64()*4-2), uint8(this.Rnd.Float64()*256), uint8(this.Rnd.Float64()*256), uint8(this.Rnd.Float64()*256), 255)
			}
			println(this.zoo.count, this.frame.DeltaMs, this.frame.NowMs)
			loop = Loop
		}
	}

	if this.frame.Input.Wheel.DeltaX != 0 || this.frame.Input.Wheel.DeltaY != 0 || this.frame.Input.Wheel.DeltaZ != 0 {
		println("wheel", this.frame.Input.Wheel.DeltaX, this.frame.Input.Wheel.DeltaY, this.frame.Input.Wheel.DeltaZ)
	}
	for _, gamepad := range this.frame.Input.Gamepads[:this.frame.Input.GamepadsLen] {
		println("gamepad", gamepad.Index, gamepad.Buttons, gamepad.Axes[0], gamepad.Axes[1])
		if gamepad.Buttons != 0 {
			loop = Loop
		}
	}
	kbd := &this.frame.Input.Keyboard
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
