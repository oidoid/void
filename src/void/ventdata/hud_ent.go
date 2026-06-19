package ventdata

import (
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vtypes"
)

// to-do: just HUD?
// HUDEnt pins content to a screen edge following the camera.
type HUDEnt struct {
	Anchor vmath.CompassDir
	Margin vmath.Border[int16]
}

// compute XY for a given WH and HUD config. non-UI layers must offset by cam.
func HudXY[T vtypes.Number](
	hud HUDEnt,
	w, h T,
	canvas vmath.WH[uint16],
) vmath.XY[T] {
	canvasW := T(canvas.W)
	canvasH := T(canvas.H)
	marginTop := T(hud.Margin.N)
	marginRight := T(hud.Margin.E)
	marginBottom := T(hud.Margin.S)
	marginLeft := T(hud.Margin.W)

	var x, y T
	switch hud.Anchor {
	case vmath.N:
		x = (canvasW - w) / 2
		y = marginTop
	case vmath.NE:
		x = canvasW - w - marginRight
		y = marginTop
	case vmath.E:
		x = canvasW - w - marginRight
		y = (canvasH - h) / 2
	case vmath.SE:
		x = canvasW - w - marginRight
		y = canvasH - h - marginBottom
	case vmath.S:
		x = (canvasW - w) / 2
		y = canvasH - h - marginBottom
	case vmath.SW:
		x = marginLeft
		y = canvasH - h - marginBottom
	case vmath.W:
		x = marginLeft
		y = (canvasH - h) / 2
	case vmath.NW:
		x = marginLeft
		y = marginTop
	case vmath.Center:
		x = (canvasW - w) / 2
		y = (canvasH - h) / 2
	}
	return vmath.XY[T]{X: x, Y: y}
}
