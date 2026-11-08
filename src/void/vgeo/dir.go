package vgeo

type Dir uint8

const (
	DirE Dir = iota
	DirNE
	DirN
	DirNW
	DirW
	DirSW
	DirS
	DirSE
	DirCenter
)

var dirXY = [...]XY[int8]{
	DirE:      {X: 1},
	DirNE:     {X: 1, Y: -1},
	DirN:      {Y: -1},
	DirNW:     {X: -1, Y: -1},
	DirW:      {X: -1},
	DirSW:     {X: -1, Y: 1},
	DirS:      {Y: 1},
	DirSE:     {X: 1, Y: 1},
	DirCenter: {},
}

// unit axis components: X is -1 for west and 1 for east; Y is -1 for north and
// 1 for south. zero is centered on that axis.
func (this Dir) XY() XY[int8] { return dirXY[this] }
