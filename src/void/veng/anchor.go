package veng

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmath"
)

// to-do: combine with HUDEnt?
// to-do: rename file anchor_ent.go.
// places content outside a reference box. each axis of `Dir` selects the side
// to extend past, separated by `Margin`, or centers across that axis.
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
	dir := this.Dir.XY()
	return vgeo.NewXY(
		anchorAxis(dir.X, ref.Min.X, ref.Max.X, w, this.Margin.X),
		anchorAxis(dir.Y, ref.Min.Y, ref.Max.Y, h, this.Margin.Y),
	)
}

// positions a size-long span before lo, after hi, or centered within.
func anchorAxis(dir int8, lo, hi, size, margin float32) float32 {
	switch {
	case dir < 0:
		return lo - size - margin
	case dir > 0:
		return hi + margin
	}
	return lo + vmath.Floor((hi-lo-size)/2)
}
