package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateMouseStatuses(
	vec *vvec.Vec[entities.MouseStatusEnt],
	gam *engine.Engine,
) vgame.Status {
	layer := gam.Layer(gfx.LayerUI)
	sprites := &layer.Sprites
	clip := layer.Clip
	in := gam.In()
	ents := vec.Vals()
	loop := vgame.Pause
	for i := range ents {
		loop |= ents[i].Update(sprites, in, clip)
	}
	return loop
}
