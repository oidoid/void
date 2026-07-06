package vhooks

import (
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateCursors[Game vgame.Game](
	ents *vvec.Vec[ventdata.CursorEnt],
	gam Game,
) vgame.Status {
	in := gam.In()
	deltaMs := gam.DeltaMs()
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		ent := &vals[i]
		layer := gam.Layer(ent.Z.Layer())
		loop |= ent.Update(in, &layer.Sprites, deltaMs, layer)
	}
	return loop
}
