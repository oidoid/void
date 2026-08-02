package vgfx

import (
	"unsafe"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
)

// to-do: rename Spr or Bmp or Anim. Anim is better aligned to parsing but Spr
// is a better fit for games.
type Spr struct {
	vgeo.XY[float32]
	AnimCel vatlas.AnimCel
	Z       Z // to-do: bake into flags and expose setter?
	_       [1]byte
	vgeo.WH[uint16]
	flags uint32
}

const SprStride = int(unsafe.Sizeof(Spr{}))

const (
	sprHiddenMask   uint32 = 1
	sprHiddenShift         = 0
	sprFlipXMask    uint32 = 1
	sprFlipXShift          = 1
	sprFlipYMask    uint32 = 1
	sprFlipYShift          = 2
	sprStretchMask  uint32 = 1
	sprStretchShift        = 3
	sprPalAnimMask  uint32 = 0xff
	sprPalAnimShift        = 4
	sprZTopMask     uint32 = 1
	sprZTopShift           = 12
)

func (this *Spr) Anim() vatlas.AnimID {
	return vatlas.AnimID(this.AnimCel >> vatlas.AnimCelShift)
}

func (this *Spr) SetAnim(id vatlas.AnimID) {
	this.AnimCel = vatlas.AnimCel(
		uint16(id)<<vatlas.AnimCelShift |
			uint16(this.AnimCel)&uint16(vatlas.AnimCelMask),
	)
}

func (this *Spr) Cel() uint8 {
	return uint8(this.AnimCel & vatlas.AnimCelMask)
}

func (this *Spr) SetCel(cel uint8) {
	this.AnimCel = vatlas.AnimCel(
		uint16(this.AnimCel)&^uint16(vatlas.AnimCelMask) |
			uint16(cel&uint8(vatlas.AnimCelMask)),
	)
}

func (this *Spr) Hidden() bool {
	return this.flags>>sprHiddenShift&sprHiddenMask != 0
}

func (this *Spr) Hide(hide bool) {
	if hide {
		this.flags |= sprHiddenMask << sprHiddenShift
	} else {
		this.flags &^= sprHiddenMask << sprHiddenShift
	}
}

func (this *Spr) FlipX() bool {
	return this.flags>>sprFlipXShift&sprFlipXMask != 0
}

func (this *Spr) SetFlipX(flip bool) {
	if flip {
		this.flags |= sprFlipXMask << sprFlipXShift
	} else {
		this.flags &^= sprFlipXMask << sprFlipXShift
	}
}

func (this *Spr) FlipY() bool {
	return this.flags>>sprFlipYShift&sprFlipYMask != 0
}

func (this *Spr) SetFlipY(flip bool) {
	if flip {
		this.flags |= sprFlipYMask << sprFlipYShift
	} else {
		this.flags &^= sprFlipYMask << sprFlipYShift
	}
}

func (this *Spr) Stretch() bool {
	return this.flags>>sprStretchShift&sprStretchMask != 0
}

// true to stretch, false to repeat.
func (this *Spr) SetStretch(stretch bool) {
	if stretch {
		this.flags |= sprStretchMask << sprStretchShift
	} else {
		this.flags &^= sprStretchMask << sprStretchShift
	}
}

func (this *Spr) Pal() vatlas.AnimID {
	return vatlas.AnimID(
		this.flags >> sprPalAnimShift & sprPalAnimMask,
	)
}

func (this *Spr) SetPal(id vatlas.AnimID) {
	this.flags = this.flags&^(sprPalAnimMask<<sprPalAnimShift) |
		(uint32(id)&sprPalAnimMask)<<sprPalAnimShift
}

// whether depth order is anchored at the top of the spr clipbox or the
// bottom (default). when off, sprs lower on the same layer are drawn in front.
// requires layer to enable depth.
func (this *Spr) ZTop() bool {
	return this.flags>>sprZTopShift&sprZTopMask != 0
}

func (this *Spr) SetZTop(zTop bool) {
	if zTop {
		this.flags |= sprZTopMask << sprZTopShift
	} else {
		this.flags &^= sprZTopMask << sprZTopShift
	}
}
