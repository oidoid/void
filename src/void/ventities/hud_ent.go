package ventities

import "github.com/oidoid/void/src/void/vgeo"

// to-do: just HUD?
// HUDEnt pins content to a screen edge following the camera.
type HUDEnt struct {
	Anchor vgeo.Dir
	Margin vgeo.Border[int16]
}

// computes an anchored position inside clip.
func (this HUDEnt) XY(w, h int16, clip vgeo.Box[float32]) vgeo.XY[int16] {
	clipX := int16(clip.Min.X)
	clipY := int16(clip.Min.Y)
	clipW := int16(clip.W())
	clipH := int16(clip.H())
	marginTop := this.Margin.N
	marginRight := this.Margin.E
	marginBottom := this.Margin.S
	marginLeft := this.Margin.W

	var x, y int16
	switch this.Anchor {
	case vgeo.DirN:
		x = (clipW - w) / 2
		y = marginTop
	case vgeo.DirNE:
		x = clipW - w - marginRight
		y = marginTop
	case vgeo.DirE:
		x = clipW - w - marginRight
		y = (clipH - h) / 2
	case vgeo.DirSE:
		x = clipW - w - marginRight
		y = clipH - h - marginBottom
	case vgeo.DirS:
		x = (clipW - w) / 2
		y = clipH - h - marginBottom
	case vgeo.DirSW:
		x = marginLeft
		y = clipH - h - marginBottom
	case vgeo.DirW:
		x = marginLeft
		y = (clipH - h) / 2
	case vgeo.DirNW:
		x = marginLeft
		y = marginTop
	case vgeo.DirCenter:
		x = (clipW - w) / 2
		y = (clipH - h) / 2
	}
	return vgeo.XY[int16]{X: clipX + x, Y: clipY + y}
}
