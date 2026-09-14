package ventities

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmath"
)

// to-do: combine with HUDEnt?
// to-do: rename file anchor_ent.go.
// places content relative to another entity box.
type AnchorEnt struct {
	Dir    vgeo.Dir
	Margin vgeo.XY[float32]
	Ref    func() vgeo.Box[float32]
}

// computes a position for a w x h rect relative to box.
func (this AnchorEnt) XY(w, h float32) vgeo.XY[float32] {
	ref := vgeo.Box[float32]{}
	if this.Ref != nil {
		ref = this.Ref()
	}
	return this.XYIn(w, h, ref)
}

// computes a position for a w x h rect relative to ref.
func (this AnchorEnt) XYIn(
	w, h float32,
	ref vgeo.Box[float32],
) vgeo.XY[float32] {
	boxW := ref.W()
	boxH := ref.H()

	var x, y float32

	switch this.Dir {
	case vgeo.DirE, vgeo.DirSE:
		x = ref.Min.X + boxW + this.Margin.X
	case vgeo.DirNE:
		x = ref.Min.X + boxW - w
	case vgeo.DirN, vgeo.DirS, vgeo.DirCenter:
		x = ref.Min.X + vmath.Floor((boxW-w)/2)
	case vgeo.DirNW:
		x = ref.Min.X
	case vgeo.DirW, vgeo.DirSW:
		x = ref.Min.X - w - this.Margin.X
	}

	switch this.Dir {
	case vgeo.DirE, vgeo.DirW, vgeo.DirCenter:
		y = ref.Min.Y + vmath.Floor((boxH-h)/2)
	case vgeo.DirNE, vgeo.DirN, vgeo.DirNW:
		y = ref.Min.Y - h - this.Margin.Y
	case vgeo.DirSW, vgeo.DirSE:
		y = ref.Min.Y + boxH - h - this.Margin.Y
	case vgeo.DirS:
		y = ref.Min.Y + boxH + this.Margin.Y
	}

	return vgeo.NewXY(x, y)
}
