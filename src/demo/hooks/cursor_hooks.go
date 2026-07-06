package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateCursors(
	vec *vvec.Vec[ventities.CursorEnt],
	gam *engine.Engine,
) vgame.Status {
	input := gam.In()
	deltaMs := gam.DeltaMs()
	ents := vec.Vals()
	loop := vgame.Pause
	for i := range ents {
		ent := &ents[i]
		layer := gam.Layer(ent.Z.Layer())
		loop |= ent.Update(input, &layer.Sprites, deltaMs, layer)
	}
	return loop
}
