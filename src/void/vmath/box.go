package vmath

import "github.com/oidoid/void/src/void/vtypes"

type Box[Pos vtypes.Number, Size vtypes.Number] struct {
	XY[Pos]
	WH[Size]
}

func NewBox[Pos vtypes.Number, Size vtypes.Number](x, y Pos, w, h Size) Box[Pos, Size] {
	return Box[Pos, Size]{XY: XY[Pos]{X: x, Y: y}, WH: WH[Size]{W: w, H: h}}
}

func (this *Box[Pos, Size]) HitsPoint(x, y Pos) bool {
	return x >= this.X && x <= this.X+Pos(this.W) && y >= this.Y && y <= this.Y+Pos(this.H)
}

func (this *Box[Pos, Size]) HitsXY(xy XY[Pos]) bool {
	return this.HitsPoint(xy.X, xy.Y)
}

// MoveBy uses XY.Add()
