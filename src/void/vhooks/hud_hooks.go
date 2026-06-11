package vhooks

import (
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vtypes"
)

// compute XY for a given WH and HUD config. non-UI layers must offset by cam.
func hudXY[T vtypes.Number](
	hud ventdata.HUDEnt,
	w, h T,
	canvas vmath.WH[uint16],
) vmath.XY[T] {
	canvasW := T(canvas.W)
	canvasH := T(canvas.H)
	margin := T(hud.Margin)

	var x, y T
	switch hud.Anchor {
	case vmath.N:
		x = (canvasW - w) / 2
		y = margin
	case vmath.NE:
		x = canvasW - w - margin
		y = margin
	case vmath.E:
		x = canvasW - w - margin
		y = (canvasH - h) / 2
	case vmath.SE:
		x = canvasW - w - margin
		y = canvasH - h - margin
	case vmath.S:
		x = (canvasW - w) / 2
		y = canvasH - h - margin
	case vmath.SW:
		x = margin
		y = canvasH - h - margin
	case vmath.W:
		x = margin
		y = (canvasH - h) / 2
	case vmath.NW:
		x = margin
		y = margin
	case vmath.Center:
		x = (canvasW - w) / 2
		y = (canvasH - h) / 2
	}
	return vmath.XY[T]{X: x, Y: y}
}
