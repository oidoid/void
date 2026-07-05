package ventdata

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmath"
)

// places content relative to another entity box.
type AnchorEnt struct {
	Dir    vgeo.Dir
	Margin vgeo.XY[float32]
}

// computes a position for a w x h rect relative to box.
func (this AnchorEnt) XY(box vgeo.Box[float32], w, h float32) vgeo.XY[float32] {
	boxW := box.W()
	boxH := box.H()

	var x, y float32

	switch this.Dir {
	case vgeo.DirW, vgeo.DirSW:
		x = box.Min.X - w - this.Margin.X
	case vgeo.DirE, vgeo.DirSE:
		x = box.Min.X + boxW + this.Margin.X
	case vgeo.DirNE:
		x = box.Min.X + boxW - w
	case vgeo.DirNW:
		x = box.Min.X
	case vgeo.DirN, vgeo.DirS, vgeo.DirCenter:
		x = box.Min.X + vmath.Floor((boxW-w)/2)
	}

	switch this.Dir {
	case vgeo.DirN, vgeo.DirNE, vgeo.DirNW:
		y = box.Min.Y - h - this.Margin.Y
	case vgeo.DirS:
		y = box.Min.Y + boxH + this.Margin.Y
	case vgeo.DirSE, vgeo.DirSW:
		y = box.Min.Y + boxH - h - this.Margin.Y
	case vgeo.DirW, vgeo.DirE, vgeo.DirCenter:
		y = box.Min.Y + vmath.Floor((boxH-h)/2)
	}

	return vgeo.XY[float32]{X: x, Y: y}
}
