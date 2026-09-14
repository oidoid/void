package vhooks

import (
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateButtons[Game any](
	vec *vvec.Vec[*ventities.ButtonEnt],
	gam *vengine.Eng[Game],
) vengine.Status {
	in := gam.In()
	cursorPhy := gam.Cursor().HitboxPhy()
	ents := vec.Vals()
	loop := vengine.Pause
	for i := range ents {
		ent := ents[i]
		layer := gam.Layer(ent.Z().Layer())
		loop |= ent.Update(
			in, &layer.Sprs, layer, gam.Font(), cursorPhy,
		)
	}
	return loop
}
