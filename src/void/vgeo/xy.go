package vgeo

import (
	"github.com/oidoid/void/src/void/vtypes"
)

type XY[T vtypes.Num] struct {
	X, Y T
}

type XYZ[T vtypes.Num] struct {
	XY[T]
	Z T
}

//go:inline
func NewXY[T vtypes.Num](x, y T) XY[T] {
	return XY[T]{X: x, Y: y}
}

//go:inline
func (this XY[T]) Cast[To vtypes.Num]() XY[To] {
	return NewXY(To(this.X), To(this.Y))
}

//go:inline
func (this XY[T]) Add(xy XY[T]) XY[T] {
	return NewXY(this.X+xy.X, this.Y+xy.Y)
}

//go:inline
func (this *XY[T]) AddTo(xy XY[T]) {
	this.X += xy.X
	this.Y += xy.Y
}

//go:inline
func (this XY[T]) Sub(xy XY[T]) XY[T] {
	return NewXY(this.X-xy.X, this.Y-xy.Y)
}

//go:inline
func (this XY[T]) Mul(v T) XY[T] {
	return NewXY(this.X*v, this.Y*v)
}

//go:inline
func (this XY[T]) Div(v T) XY[T] {
	return NewXY(this.X/v, this.Y/v)
}
