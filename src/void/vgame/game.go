package vgame

import (
	"unsafe"

	"github.com/oidoid/void/src/void/vlevels"
	"github.com/oidoid/void/src/void/vmath"
)

type Game interface {
	Frame() *Frame
	FramePointer() uintptr
	CamX() float32
	CamY() float32
	LevelX() int16
	LevelY() int16
	LevelW() uint16
	LevelH() uint16
	W() int
	H() int
	Update() LoopState
}

type Engine struct {
	frame Frame
	Rnd   vmath.Random
	Cam   vmath.XY[float32]
	Level *vlevels.Level
}

var _ Game = (*Engine)(nil)

func NewEngine() *Engine {
	return &Engine{Rnd: vmath.NewRandom()}
}

func (this *Engine) Frame() *Frame { return &this.frame }

func (this *Engine) FramePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.frame))
}

func (this *Engine) CamX() float32 { return this.Cam.X }
func (this *Engine) CamY() float32 { return this.Cam.Y }

func (this *Engine) LevelX() int16  { return this.Level.X }
func (this *Engine) LevelY() int16  { return this.Level.Y }
func (this *Engine) LevelW() uint16 { return this.Level.W }
func (this *Engine) LevelH() uint16 { return this.Level.H }

func (this *Engine) W() int { return int(this.frame.CanvasW) }
func (this *Engine) H() int { return int(this.frame.CanvasH) }

func (this *Engine) Update() LoopState {
	return Pause
}
