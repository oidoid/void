package vhooks

import (
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateDrawStatuses[Game vgame.Game](
	ents *vvec.Vec[ventdata.DrawStatusEnt],
	gam Game,
) vgame.Status {
	// to-do: get prior frame's sprite count.
	sprites := gam.Sprites()
	font := gam.Font()
	nowMs := gam.NowMs()
	tick := gam.Tick()
	canvasPhy := *gam.CanvasPhy()
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		loop |= vals[i].Update(font, sprites, nowMs, tick, canvasPhy)
	}
	return loop
}
