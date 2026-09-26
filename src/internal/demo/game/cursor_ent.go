package game

import (
	"github.com/oidoid/void/src/void/vengine"
)

type CursorEnt struct {
	vengine.CursorEnt
}

func (this *CursorEnt) Update(gam *Game) vengine.Status {
	layer := gam.Layer(this.Spr.Z.Layer())
	return this.CursorEnt.Update(
		gam.In(), &layer.Sprs, gam.DeltaSecs(), layer,
	)
}
