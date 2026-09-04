package vgfx

import (
	"unsafe"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
)

// to-do: how much do we care about sprite size with culling?
// to-do: rename Spr or Bmp or Anim. Anim is better aligned to parsing but Spr
// is a better fit for games.
type Spr struct {
	vgeo.XY[float32]
	TagCel vatlas.TagCel
	Z      Z // to-do: bake into flags and expose setter?
	_      [1]byte
	vgeo.WH[uint16]
	flags uint32
}

const SprStride = int(unsafe.Sizeof(Spr{}))
const SprPalMax = vatlas.Tag(sprPalTagMask)

const (
	sprHiddenMask   uint32 = 1
	sprHiddenShift         = 0
	sprFlipXMask    uint32 = 1
	sprFlipXShift          = 1
	sprFlipYMask    uint32 = 1
	sprFlipYShift          = 2
	sprStretchMask  uint32 = 1
	sprStretchShift        = 3
	sprPalTagMask   uint32 = 0xff
	sprPalTagShift         = 4
	sprZTopMask     uint32 = 1
	sprZTopShift           = 12
	sprRotMask      uint32 = 0xfff
	sprRotShift            = 13

	sprRotRadians = float32(2 * 3.141592653589793 / 4096)
)

func (this *Spr) Tag() vatlas.Tag {
	return vatlas.Tag(this.TagCel >> vatlas.TagCelShift)
}

func (this *Spr) SetTag(tag vatlas.Tag) {
	this.TagCel = vatlas.TagCel(
		uint16(tag)<<vatlas.TagCelShift |
			uint16(this.TagCel)&uint16(vatlas.TagCelMask),
	)
}

func (this *Spr) Cel() uint8 {
	return uint8(this.TagCel & vatlas.TagCelMask)
}

func (this *Spr) SetCel(cel uint8) {
	this.TagCel = vatlas.TagCel(
		uint16(this.TagCel)&^uint16(vatlas.TagCelMask) |
			uint16(cel&uint8(vatlas.TagCelMask)),
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

func (this *Spr) Pal() vatlas.Tag {
	return vatlas.Tag(
		this.flags >> sprPalTagShift & sprPalTagMask,
	)
}

func (this *Spr) SetPal(tag vatlas.Tag) {
	this.flags = this.flags&^(sprPalTagMask<<sprPalTagShift) |
		(uint32(tag)&sprPalTagMask)<<sprPalTagShift
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

func (this *Spr) Rot() float32 {
	return float32(this.flags>>sprRotShift&sprRotMask) * sprRotRadians
}

func (this *Spr) SetRot(rot float32) {
	steps := rot / sprRotRadians
	if steps < 0 {
		steps -= .5
	} else {
		steps += .5
	}
	this.flags = this.flags&^(sprRotMask<<sprRotShift) |
		(uint32(int32(steps))&sprRotMask)<<sprRotShift
}
