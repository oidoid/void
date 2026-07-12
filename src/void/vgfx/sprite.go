package vgfx

import (
	"unsafe"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
)

type Sprite struct {
	vgeo.XY[float32]
	AnimCel vatlas.AnimCel
	Z       Z
	_       [1]byte
	vgeo.WH[uint16]
	flags uint32
}

const SpriteStride = int(unsafe.Sizeof(Sprite{}))

const (
	SpriteHiddenFlag uint32 = 1
	SpriteFlipXFlag  uint32 = 2
	SpriteFlipYFlag  uint32 = 4

	// to-do: bit pattern elsewehre with shift and mask.
	// flip flag bits for FlipByDir and SetFlipX/SetFlipY.
	FlipX uint8 = 1
	FlipY uint8 = 2
)

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

func (this *Sprite) Hidden() bool { return this.flags&SpriteHiddenFlag != 0 }

func (this *Sprite) Hide(hide bool) {
	if hide {
		this.flags |= SpriteHiddenFlag
	} else {
		this.flags &^= SpriteHiddenFlag
	}
}

func (this *Sprite) FlipX() bool { return this.flags&SpriteFlipXFlag != 0 }

func (this *Sprite) SetFlipX(flip bool) {
	if flip {
		this.flags |= SpriteFlipXFlag
	} else {
		this.flags &^= SpriteFlipXFlag
	}
}

func (this *Sprite) FlipY() bool { return this.flags&SpriteFlipYFlag != 0 }

func (this *Sprite) SetFlipY(flip bool) {
	if flip {
		this.flags |= SpriteFlipYFlag
	} else {
		this.flags &^= SpriteFlipYFlag
	}
}
