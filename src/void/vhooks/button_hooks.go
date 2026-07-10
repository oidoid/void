package vhooks

import (
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateButtons[Game vgame.Game](
	vec *vvec.Vec[ventities.ButtonEnt],
	gam Game,
) vgame.Status {
	in := gam.In()
	ents := vec.Vals()
	loop := vgame.Pause
	for i := range ents {
		ent := &ents[i]
		layer := gam.Layer(ent.Z.Layer())
		loop |= ent.Update(in, &layer.Sprites, layer)
	}
	return loop
}
