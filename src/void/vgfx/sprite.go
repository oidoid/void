package vgfx

import (
	"unsafe"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
)

type Sprite struct {
	vgeo.XY[float32] // to-do: drop XY/WH?
	AnimCel          vatlas.AnimCel
	Z                Z
	_                [1]byte
	vgeo.WH[uint16]
	flags uint32
}

const MaxSpriteSize = float32(16) // to-do: move to demo.
const SpriteStride = int(unsafe.Sizeof(Sprite{}))

func (this *Sprite) Anim() vatlas.AnimID {
	return vatlas.AnimID(this.AnimCel >> vatlas.AnimCelShift)
}

func (this *Sprite) SetAnim(id vatlas.AnimID) {
	this.AnimCel = vatlas.AnimCel(
		uint16(id)<<vatlas.AnimCelShift | uint16(this.AnimCel)&uint16(vatlas.AnimCelMask),
	)
}

func (this *Sprite) Cel() uint8 {
	return uint8(this.AnimCel & vatlas.AnimCelMask)
}

func (this *Sprite) SetCel(cel uint8) {
	this.AnimCel = vatlas.AnimCel(
		uint16(this.AnimCel)&^uint16(vatlas.AnimCelMask) | uint16(cel&uint8(vatlas.AnimCelMask)),
	)
}

func (this *Sprite) Hidden() bool {
	return this.flags&1 != 0
}

func (this *Sprite) Hide(hide bool) {
	if hide {
		this.flags |= 1
	} else {
		this.flags &^= 1
	}
}
