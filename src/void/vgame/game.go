package vgame

import "github.com/oidoid/void/src/void/vmath"

type Game interface {
	Platform
	Frame() *Frame
	Random() float32
	Cam() *vmath.XY[float32]
}
