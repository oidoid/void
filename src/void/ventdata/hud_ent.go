package ventdata

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vtypes"
)

// to-do: just HUD?
// HUDEnt pins content to a screen edge following the camera.
type HUDEnt struct {
	Anchor vgeo.Dir
	Margin vgeo.Border[int16]
}

// compute XY for a given WH and HUD config. non-UI layers must offset by cam.
func HudXY[T vtypes.Number](
	hud HUDEnt,
	w, h T,
	canvas vgeo.WH[uint16],
) vgeo.XY[T] {
	canvasW := T(canvas.W)
	canvasH := T(canvas.H)
	marginTop := T(hud.Margin.N)
	marginRight := T(hud.Margin.E)
	marginBottom := T(hud.Margin.S)
	marginLeft := T(hud.Margin.W)

	var x, y T
	switch hud.Anchor {
	case vgeo.DirN:
		x = (canvasW - w) / 2
		y = marginTop
	case vgeo.DirNE:
		x = canvasW - w - marginRight
		y = marginTop
	case vgeo.DirE:
		x = canvasW - w - marginRight
		y = (canvasH - h) / 2
	case vgeo.DirSE:
		x = canvasW - w - marginRight
		y = canvasH - h - marginBottom
	case vgeo.DirS:
		x = (canvasW - w) / 2
		y = canvasH - h - marginBottom
	case vgeo.DirSW:
		x = marginLeft
		y = canvasH - h - marginBottom
	case vgeo.DirW:
		x = marginLeft
		y = (canvasH - h) / 2
	case vgeo.DirNW:
		x = marginLeft
		y = marginTop
	case vgeo.DirCenter:
		x = (canvasW - w) / 2
		y = (canvasH - h) / 2
	}
	return vgeo.XY[T]{X: x, Y: y}
}
