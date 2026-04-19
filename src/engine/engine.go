package void

import (
	"unsafe"

	"math/rand/v2"

	"github.com/oidoid/void/src/engine/geo"
	"github.com/oidoid/void/src/engine/input"
)

var _ WasmAPI = (*Engine)(nil)

type Engine struct {
	update  Update
	zoo     Zoo
	rnd     *rand.Rand
	Cam     geo.XY[float32]
	CanvasW int32
	CanvasH int32
}

func NewEngine() Engine {
	return Engine{rnd: rand.New(rand.NewPCG(rand.Uint64(), rand.Uint64()))}
}

func (this *Engine) GetSpriteCount() uint32 {
	return uint32(this.zoo.count)
}

func (this *Engine) GetSpritePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.zoo.sprites[0]))
}

func (this *Engine) GetUpdatePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.update))
}

func (this *Engine) Frame() *Update { return &this.update }

func (this *Engine) GetCamX() float32 { return this.Cam.X }
func (this *Engine) GetCamY() float32 { return this.Cam.Y }

func (this *Engine) Update() LoopState {
	// to-do: moveinto demo and make ball bounds level sized.
	this.zoo.SetSize(int(this.update.CanvasW), int(this.update.CanvasH))
	this.zoo.Update()
	loop := Pause
	if this.zoo.count > 0 {
		loop = Loop
	}
	for _, pointer := range this.update.Input.Pointers[:this.update.Input.PointersLen] {
		if pointer.Buttons != 0 {
			for range 1000 {
				radius := uint8(this.rnd.IntN(3) + 8)
				this.zoo.DrawCircle(pointer.X, pointer.Y, radius,
					this.rnd.Float32()*4-2, this.rnd.Float32()*4-2, uint8(this.rnd.IntN(256)), uint8(this.rnd.IntN(256)), uint8(this.rnd.IntN(256)), 255)
			}
			println(this.zoo.count, this.update.DeltaMs, this.update.NowMs)
			loop = Loop
		}
	}

	if this.update.Input.Wheel.DeltaX != 0 || this.update.Input.Wheel.DeltaY != 0 || this.update.Input.Wheel.DeltaZ != 0 {
		println("wheel", this.update.Input.Wheel.DeltaX, this.update.Input.Wheel.DeltaY, this.update.Input.Wheel.DeltaZ)
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
