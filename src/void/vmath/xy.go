package vmath

import "github.com/oidoid/void/src/void/vtypes"

type XY[T vtypes.Number] struct {
	X, Y T
}

type XYZ[T vtypes.Number] struct {
	XY[T]
	Z T
}

func NewXY[T vtypes.Number](x, y T) XY[T] {
	return XY[T]{X: x, Y: y}
}

// add to.
func (this *XY[T]) Add(xy XY[T]) {
	this.X += xy.X
	this.Y += xy.Y
}
