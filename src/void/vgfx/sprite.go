package vgfx

import (
	"unsafe"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
)

// to-do: rename Spr or Bmp or Anim. Anim is better aligned to parsing but Spr
// is a better fit for games.
type Sprite struct {
	vgeo.XY[float32]
	AnimCel vatlas.AnimCel
	Z       Z // to-do: bake into flags and expose setter?
	// to-do: add zend.
	_ [1]byte
	vgeo.WH[uint16]
	flags uint32
}

const SpriteStride = int(unsafe.Sizeof(Sprite{}))

const (
	spriteHiddenMask   uint32 = 1
	spriteHiddenShift         = 0
	spriteFlipXMask    uint32 = 1
	spriteFlipXShift          = 1
	spriteFlipYMask    uint32 = 1
	spriteFlipYShift          = 2
	spriteStretchMask  uint32 = 1
	spriteStretchShift        = 3
	spritePalAnimMask  uint32 = 0xff
	spritePalAnimShift        = 4
)

func (this *Sprite) Anim() vatlas.AnimID {
	return vatlas.AnimID(this.AnimCel >> vatlas.AnimCelShift)
}

func (this *Sprite) SetAnim(id vatlas.AnimID) {
	this.AnimCel = vatlas.AnimCel(
		uint16(id)<<vatlas.AnimCelShift |
			uint16(this.AnimCel)&uint16(vatlas.AnimCelMask),
	)
}

func (this *Sprite) Cel() uint8 {
	return uint8(this.AnimCel & vatlas.AnimCelMask)
}

func (this *Sprite) SetCel(cel uint8) {
	this.AnimCel = vatlas.AnimCel(
		uint16(this.AnimCel)&^uint16(vatlas.AnimCelMask) |
			uint16(cel&uint8(vatlas.AnimCelMask)),
	)
}

func (this *Sprite) Hidden() bool {
	return this.flags>>spriteHiddenShift&spriteHiddenMask != 0
}

func (this *Sprite) Hide(hide bool) {
	if hide {
		this.flags |= spriteHiddenMask << spriteHiddenShift
	} else {
		this.flags &^= spriteHiddenMask << spriteHiddenShift
	}
}

func (this *Sprite) FlipX() bool {
	return this.flags>>spriteFlipXShift&spriteFlipXMask != 0
}

func (this *Sprite) SetFlipX(flip bool) {
	if flip {
		this.flags |= spriteFlipXMask << spriteFlipXShift
	} else {
		this.flags &^= spriteFlipXMask << spriteFlipXShift
	}
}

func (this *Sprite) FlipY() bool {
	return this.flags>>spriteFlipYShift&spriteFlipYMask != 0
}

func (this *Sprite) SetFlipY(flip bool) {
	if flip {
		this.flags |= spriteFlipYMask << spriteFlipYShift
	} else {
		this.flags &^= spriteFlipYMask << spriteFlipYShift
	}
}

func (this *Sprite) Stretch() bool {
	return this.flags>>spriteStretchShift&spriteStretchMask != 0
}

// true to stretch, false to repeat.
func (this *Sprite) SetStretch(stretch bool) {
	if stretch {
		this.flags |= spriteStretchMask << spriteStretchShift
	} else {
		this.flags &^= spriteStretchMask << spriteStretchShift
	}
}

func (this *Sprite) Pal() vatlas.AnimID {
	return vatlas.AnimID(
		this.flags >> spritePalAnimShift & spritePalAnimMask,
	)
}

func (this *Sprite) SetPal(id vatlas.AnimID) {
	this.flags = this.flags&^(spritePalAnimMask<<spritePalAnimShift) |
		(uint32(id)&spritePalAnimMask)<<spritePalAnimShift
}
