package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateDrawStatuses(
	vec *vvec.Vec[entities.DrawStatusEnt],
	gam *engine.Engine,
) vgame.Status {
	font := gam.Font()
	nowMillis := gam.NowMillis()
	tick := gam.Tick()
	ents := vec.Vals()
	loop := vgame.Pause
	for i := range ents {
		layer := gam.Layer(ents[i].Z.Layer())
		sprites := &layer.Sprites
		loop |= ents[i].Update(font, sprites, nowMillis, tick, layer.Clip)
	}
	return loop
}
