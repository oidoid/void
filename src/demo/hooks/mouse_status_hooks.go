package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateMouseStatuses(
	ents *vvec.Vec[entdata.MouseStatusEnt],
	gam *engine.Engine,
) vgame.Status {
	sprites := gam.Sprites()
	in := gam.In()
	canvasPhy := *gam.CanvasPhy()
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		loop |= vals[i].Update(sprites, in, canvasPhy)
	}
	return loop
}
