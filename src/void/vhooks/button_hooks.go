package vhooks

import (
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateButtons[Game vgame.Game](
	vec *vvec.Vec[*ventities.ButtonEnt],
	gam Game,
) vgame.Status {
	in := gam.In()
	cursorPhy, cursorOn := gam.CursorPhy()
	var cursorPhyPtr *vgeo.XY[float32]
	if cursorOn {
		cursorPhyPtr = &cursorPhy
	}
	ents := vec.Vals()
	loop := vgame.Pause
	for i := range ents {
		ent := ents[i]
		layer := gam.Layer(ent.Z().Layer())
		loop |= ent.Update(in, &layer.Sprs, layer, gam.Font(), cursorPhyPtr)
	}
	return loop
}
