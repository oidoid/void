package vgfx

import (
	"unsafe"

	"github.com/oidoid/void/src/void/vmath"
)

type Sprite struct {
	vmath.XY[float32]
	AnimID uint16
	Cel    uint8
	_      [1]byte
	Z      uint32
	flags  uint64
}

const MaxSpriteSize = float32(16)
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
