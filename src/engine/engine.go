package void

import (
	"unsafe"

	"github.com/oidoid/void/src/engine/geo"
)

type Engine struct {
	frame Frame
	Rnd   Random
	Cam   geo.XY[float32]
}

func NewEngine() *Engine {
	return &Engine{Rnd: newRandom()}
}

func (this *Engine) FramePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.frame))
}

func (this *Engine) Frame() *Frame { return &this.frame }

func (this *Engine) CamX() float32 { return this.Cam.X }
func (this *Engine) CamY() float32 { return this.Cam.Y }

func (this *Engine) Update() LoopState {
	return Pause
}
