package vgame

import (
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vinput"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

type Game interface {
	Platform
	Frame() *Frame
	Random() float32
	Cam() *vmath.XY[float32]
	Canvas() *vmath.WH[uint16]
	Input() *vinput.Input
	Sprites() *vvec.Vec[vgfx.Sprite]
}
