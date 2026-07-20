package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateClocks(
	vec *vvec.Vec[entities.ClockEnt],
	gam *engine.Engine,
) vgame.Status {
	layer := gam.Layer(gfx.LayerClock)
	font := gam.Font()
	ents := vec.Vals()
	loop := vgame.Pause
	nowMillis := gam.NowMillis()
	time := gam.Time()
	requestUpdateAtMillis := gam.RequestUpdateAtMillis
	for i := range ents {
		loop |= ents[i].Update(
			font, &layer.Sprites, nowMillis, time, layer.Clip, requestUpdateAtMillis,
		)
	}
	return loop
}
