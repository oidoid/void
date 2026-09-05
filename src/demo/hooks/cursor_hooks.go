package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

// to-do: either pass gam to small ents so their vector hooks do not unpack it
// OR expose a `Engine.UpdateCursor()`.

func UpdateCursors(
	vec *vvec.Vec[*ventities.CursorEnt],
	gam *engine.Eng,
) vgame.Status {
	input := gam.In()
	deltaSecs := gam.DeltaSecs()
	ents := vec.Vals()
	loop := vgame.Pause
	for i := range ents {
		ent := ents[i]
		layer := gam.Layer(ent.Z.Layer())
		loop |= ent.Update(input, &layer.Sprs, deltaSecs, layer)
	}
	return loop
}
