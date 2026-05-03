package vmath

import "github.com/oidoid/void/src/void/vtypes"

type Box[T vtypes.Number] struct {
	Min, Max XY[T]
}

func NewBox[T vtypes.Number](minX, minY, maxX, maxY T) Box[T] {
	return Box[T]{Min: XY[T]{X: minX, Y: minY}, Max: XY[T]{X: maxX, Y: maxY}}
}

func NewXYWH[T vtypes.Number](minX, minY, w, h T) Box[T] {
	return Box[T]{Min: XY[T]{X: minX, Y: minY}, Max: XY[T]{X: minX + w, Y: minY + h}}
}

func (this *Box[T]) HitsPoint(x, y T) bool {
	return x >= this.Min.X && x <= this.Max.X && y >= this.Min.Y && y <= this.Max.Y
}

func (this *Box[T]) HitsXY(xy XY[T]) bool {
	return this.HitsPoint(xy.X, xy.Y)
}

func (this *Box[T]) W() T { return this.Max.X - this.Min.X }
func (this *Box[T]) H() T { return this.Max.Y - this.Min.Y }
