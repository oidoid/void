package vmath

import "github.com/oidoid/void/src/void/vtypes"

type Box[Pos vtypes.Number, Size any] struct {
	XY[Pos]
	WH[Size]
}

// MoveBy uses XY.Add()
