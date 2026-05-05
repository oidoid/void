package vgfx

import (
	"unsafe"

	"github.com/oidoid/void/src/void/vmath"
)

type Sprite struct {
	vmath.XY[float32]
	Radius     uint8
	R, G, B, A uint8
	Z          uint32
	flags      uint64
}

const MaxRadius = float32(16)
const SpriteStride = int(unsafe.Sizeof(Sprite{}))

func (this *Sprite) Hidden() bool {
	return this.flags&1 != 0
}

func (this *Sprite) Hide() {
	this.flags |= 1
}

func (this *Sprite) Show() {
	this.flags &^= 1
}
