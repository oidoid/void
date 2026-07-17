package ventities

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmath"
)

// to-do: combine with HUDEnt?
// to-do: replace ent with functions?
// to-do: rename file anchor_ent.go.
// places content relative to another entity box.
type AnchorRef interface {
	AnchorBox() vgeo.Box[float32]
}

type BoxAnchorRef struct {
	Box vgeo.Box[float32]
}

func (this BoxAnchorRef) AnchorBox() vgeo.Box[float32] { return this.Box }

type AnchorEnt struct {
	Dir    vgeo.Dir
	Margin vgeo.XY[float32]
	Ref    AnchorRef
}

// computes a position for a w x h rect relative to box.
func (this AnchorEnt) XY(w, h float32) vgeo.XY[float32] {
	ref := vgeo.Box[float32]{}
	if this.Ref != nil {
		ref = this.Ref.AnchorBox()
	}
	boxW := ref.W()
	boxH := ref.H()

	var x, y float32

	switch this.Dir {
	case vgeo.DirW, vgeo.DirSW:
		x = ref.Min.X - w - this.Margin.X
	case vgeo.DirE, vgeo.DirSE:
		x = ref.Min.X + boxW + this.Margin.X
	case vgeo.DirNE:
		x = ref.Min.X + boxW - w
	case vgeo.DirNW:
		x = ref.Min.X
	case vgeo.DirN, vgeo.DirS, vgeo.DirCenter:
		x = ref.Min.X + vmath.Floor((boxW-w)/2)
	}

	switch this.Dir {
	case vgeo.DirN, vgeo.DirNE, vgeo.DirNW:
		y = ref.Min.Y - h - this.Margin.Y
	case vgeo.DirS:
		y = ref.Min.Y + boxH + this.Margin.Y
	case vgeo.DirSE, vgeo.DirSW:
		y = ref.Min.Y + boxH - h - this.Margin.Y
	case vgeo.DirW, vgeo.DirE, vgeo.DirCenter:
		y = ref.Min.Y + vmath.Floor((boxH-h)/2)
	}

	return vgeo.XY[float32]{X: x, Y: y}
}
