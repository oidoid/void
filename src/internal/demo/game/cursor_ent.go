package game

import (
	"github.com/oidoid/void/src/void/veng"
)

type CursorEnt struct {
	veng.CursorEnt
}

func (this *CursorEnt) Update(gam *Game) veng.Status {
	layer := gam.Layer(this.Spr.Z.Layer())
	return this.CursorEnt.Update(
		gam.In(), &layer.Sprs, gam.DeltaSecs(), layer,
	)
}
