package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateCursors(
	ents *vvec.Vec[ventdata.CursorEnt],
	gam *engine.Engine,
) vgame.Status {
	input := gam.In()
	deltaMs := gam.Tick().DeltaMs
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		ent := &vals[i]
		layer := gam.Layer(ent.Z.Layer())
		loop |= ent.Update(input, &layer.Sprites, deltaMs, layer)
	}
	return loop
}
