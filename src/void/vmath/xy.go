package vmath

import "github.com/oidoid/void/src/void/vtypes"

type XY[T vtypes.Number] struct {
	X, Y T
}

type XYZ[T vtypes.Number] struct {
	XY[T]
	Z T
}

func (this *XY[T]) Add(xy XY[T]) {
	this.X += xy.X
	this.Y += xy.Y
}
