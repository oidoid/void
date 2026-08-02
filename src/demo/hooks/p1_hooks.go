package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateP1s(
	vec *vvec.Vec[entities.P1Ent],
	gam *engine.Engine,
) vgame.Status {
	layer := gam.Layer(gfx.LayerP1)
	sprs := &layer.Sprs
	clip := layer.Clip
	ents := vec.Vals()
	deltaMillis := gam.DeltaMs()
	level := gam.Level
	loop := vgame.Pause
	for i := range ents {
		loop |= ents[i].Update(sprs, clip, deltaMillis, level)
	}
	return loop
}
