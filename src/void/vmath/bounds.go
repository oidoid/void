package vmath

import "github.com/oidoid/void/src/void/vtypes"

// XY2, MinMax?

type Bounds[T vtypes.Number] struct {
	Min, Max XY[T]
}

func NewBounds[T vtypes.Number](minX, minY, maxX, maxY T) Bounds[T] {
	return Bounds[T]{Min: XY[T]{X: minX, Y: minY}, Max: XY[T]{X: maxX, Y: maxY}}
}

func (this *Bounds[T]) HitsPoint(x, y T) bool {
	return x >= this.Min.X && x <= this.Max.X && y >= this.Min.Y && y <= this.Max.Y
}

func (this *Bounds[T]) HitsXY(xy XY[T]) bool {
	return this.HitsPoint(xy.X, xy.Y)
}
