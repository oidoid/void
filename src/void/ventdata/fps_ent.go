package ventdata

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vtext"
)

type FPSEnt struct {
	HUDEnt
	TextEnt
	BackgroundAnimID vatlas.AnimID
	Next             struct {
		// start of the current one-second FPS counting window in milliseconds.
		Start float64
		// frames counted in the current window.
		Frames int
	}
	// Frames counted in the previous window.
	PrevFPS int
}

func NewFPSEnt(backgroundAnimID vatlas.AnimID) FPSEnt {
	ent := FPSEnt{BackgroundAnimID: backgroundAnimID}
	ent.Trim = vtext.TrimLeading
	ent.Anchor = vmath.SE
	ent.Margin = 4
	return ent
}
