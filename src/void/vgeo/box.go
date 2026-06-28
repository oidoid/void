package vgeo

import "github.com/oidoid/void/src/void/vtypes"

type Box[T vtypes.Number] struct {
	// to-do: Min may not be minimum. rename From and To?
	Min, Max XY[T]
}

func NewBox[T vtypes.Number](minX, minY, maxX, maxY T) Box[T] {
	return Box[T]{Min: XY[T]{X: minX, Y: minY}, Max: XY[T]{X: maxX, Y: maxY}}
}

func (this Box[T]) HitsPoint(x, y T) bool {
	return x >= this.Min.X && x <= this.Max.X && y >= this.Min.Y && y <= this.Max.Y
}

func (this Box[T]) HitsXY(xy XY[T]) bool {
	return this.HitsPoint(xy.X, xy.Y)
}

func (this Box[T]) HitsBox(box Box[T]) bool {
	return this.Min.X <= box.Max.X && this.Max.X >= box.Min.X &&
		this.Min.Y <= box.Max.Y && this.Max.Y >= box.Min.Y
}

func (this Box[T]) W() T { return this.Max.X - this.Min.X }
func (this Box[T]) H() T { return this.Max.Y - this.Min.Y }

func XYWH[T vtypes.Number](x, y, w, h T) Box[T] {
	return Box[T]{Min: XY[T]{X: x, Y: y}, Max: XY[T]{X: x + w, Y: y + h}}
}

// to-do: old intersection code.
