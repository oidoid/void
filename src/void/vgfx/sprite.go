package vgfx

import "github.com/oidoid/void/src/void/vmath"

type Sprite struct {
	vmath.XY[float32]
	Radius     uint8
	R, G, B, A uint8
	Z          uint32
}

const MaxRadius = float32(16)
