package vengine

import (
	"unsafe"

	"github.com/oidoid/void/src/void/vmath"
)

type Engine struct {
	Frame *Frame
	Rnd   vmath.Random
	Cam   vmath.XY[float32]
}

func NewEngine() *Engine {
	return &Engine{Rnd: vmath.NewRandom()}
}

func (this *Engine) FramePointer() uintptr {
	return uintptr(unsafe.Pointer(this.Frame))
}

func (this *Engine) CamX() float32 { return this.Cam.X }
func (this *Engine) CamY() float32 { return this.Cam.Y }

func (this *Engine) Update() LoopState {
	return Pause
}
