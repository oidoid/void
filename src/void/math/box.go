package math

type Box[Pos, Size any] struct {
	XY[Pos]
	WH[Size]
}

// MoveBy uses XY.Add()
