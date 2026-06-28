package ventdata

import "github.com/oidoid/void/src/void/vgeo"

// computes XY to place a w x h rect relative to box at dir with margin.
// analogous to HudXY but for entity-relative anchoring rather than HUD
// pinning.
func AnchorXY(
	dir vgeo.Dir,
	margin vgeo.XY[float32],
	box vgeo.Box[float32],
	w, h float32,
) vgeo.XY[float32] {
	boxW := box.W()
	boxH := box.H()

	var x, y float32

	switch dir {
	case vgeo.DirW, vgeo.DirSW:
		x = box.Min.X - w - margin.X
	case vgeo.DirE, vgeo.DirSE:
		x = box.Min.X + boxW + margin.X
	case vgeo.DirNE:
		x = box.Min.X + boxW - w
	case vgeo.DirNW:
		x = box.Min.X
	case vgeo.DirN, vgeo.DirS, vgeo.DirCenter:
		x = box.Min.X + float32(int32(boxW-w)/2)
	}

	switch dir {
	case vgeo.DirN, vgeo.DirNE, vgeo.DirNW:
		y = box.Min.Y - h - margin.Y
	case vgeo.DirS:
		y = box.Min.Y + boxH + margin.Y
	case vgeo.DirSE, vgeo.DirSW:
		y = box.Min.Y + boxH - h - margin.Y
	case vgeo.DirW, vgeo.DirE, vgeo.DirCenter:
		y = box.Min.Y + float32(int32(boxH-h)/2)
	}

	return vgeo.XY[float32]{X: x, Y: y}
}
