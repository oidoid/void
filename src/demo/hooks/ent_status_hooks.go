package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateEntStatuses(
	vec *vvec.Vec[entities.EntStatusEnt],
	gam *engine.Engine,
) vgame.Status {
	font := gam.Font()
	count := gam.Balls.Len()
	spriteCount := len(gam.Layer(gfx.LayerSuperballs).Sprites) // to-do: prior frame aggregate count.
	ents := vec.Vals()
	loop := vgame.Pause
	for i := range ents {
		layer := gam.Layer(ents[i].Z.Layer())
		sprites := &layer.Sprites
		loop |= ents[i].Update(font, sprites, count, spriteCount, layer.Clip)
	}
	return loop
}
