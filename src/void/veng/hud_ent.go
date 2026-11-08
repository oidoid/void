package veng

import "github.com/oidoid/void/src/void/vgeo"

// to-do: just HUD?
// HUDEnt pins content to a screen edge following the camera.
type HUDEnt struct {
	Anchor vgeo.Dir
	Margin vgeo.Edge[int16]
}

// computes an anchored position inside clip.
func (this HUDEnt) XY(w, h int16, clip vgeo.Box[float32]) vgeo.XY[int16] {
	dir := this.Anchor.XY()
	return vgeo.NewXY(
		int16(clip.Min.X)+
			hudAxis(dir.X, int16(clip.W()), w, this.Margin.W, this.Margin.E),
		int16(clip.Min.Y)+
			hudAxis(dir.Y, int16(clip.H()), h, this.Margin.N, this.Margin.S),
	)
}

// positions a size-long span inside clip at its lo edge, hi edge, or center.
func hudAxis(dir int8, clipSize, size, loMargin, hiMargin int16) int16 {
	switch {
	case dir < 0:
		return loMargin
	case dir > 0:
		return clipSize - size - hiMargin
	}
	return (clipSize - size) / 2
}
