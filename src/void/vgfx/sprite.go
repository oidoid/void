package vgfx

import (
	"unsafe"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmath"
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

// snaps xy to half-pixel grid for diagonal movement.
func DiagonalizeXY(xy vgeo.XY[float32], dir int) vgeo.XY[float32] {
	const epsilon = float32(1) / 64
	xy.X = float32(vmath.Floor(xy.X)) + 0.5
	if dir > 0 {
		xy.Y = float32(vmath.Floor(xy.Y)) + 0.5
	} else {
		xy.Y = float32(vmath.Floor(xy.Y)) + 0.5 - epsilon
	}
	return xy
}

// floor to nearest sprite quantum (1/64).
func FloorEpsilon(x float32) float32 {
	const epsilon = float32(1) / 64
	return float32(vmath.Floor(x/epsilon)) * epsilon
}
