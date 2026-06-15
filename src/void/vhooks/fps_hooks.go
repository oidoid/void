package vhooks

import (
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateFPSes[Game vgame.Game](
	ents *vvec.Vec[ventdata.FPSEnt],
	gam Game,
) vgame.Status {
	batch := gam.BeginDraw()
	font := gam.Font()
	nowMs := gam.NowMs()
	tick := gam.Tick()
	canvas := *gam.Canvas()
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		loop |= vals[i].Update(font, &batch, nowMs, tick, canvas)
	}
	gam.EndDraw(batch)
	return loop
}
