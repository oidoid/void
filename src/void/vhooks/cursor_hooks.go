package vhooks

import (
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateCursors[Game vgame.Game](
	vec *vvec.Vec[ventities.CursorEnt],
	gam Game,
) vgame.Status {
	in := gam.In()
	deltaMs := gam.DeltaMs()
	ents := vec.Vals()
	loop := vgame.Pause
	for i := range ents {
		ent := &ents[i]
		layer := gam.Layer(ent.Z.Layer())
		loop |= ent.Update(in, &layer.Sprites, deltaMs, layer)
	}
	return loop
}
