package game

import (
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateCursors(
	vec *vvec.Vec[*vengine.CursorEnt],
	gam *Game,
) vengine.Status {
	in := gam.In()
	deltaSecs := gam.DeltaSecs()
	ents := vec.Vals()
	loop := vengine.Pause
	for i := range ents {
		ent := ents[i]
		layer := gam.Layer(ent.Spr.Z.Layer())
		loop |= ent.Update(in, &layer.Sprs, deltaSecs, layer)
	}
	return loop
}
