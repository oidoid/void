package vgeo

import "github.com/oidoid/void/src/void/vtypes"

type WH[T vtypes.Num] struct {
	W, H T
}

//go:inline
func NewWH[T vtypes.Num](w, h T) WH[T] {
	return WH[T]{W: w, H: h}
}

//go:inline
func (this WH[T]) Cast[To vtypes.Num]() WH[To] {
	return NewWH(To(this.W), To(this.H))
}
