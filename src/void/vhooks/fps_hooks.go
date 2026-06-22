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
	sprites := gam.Sprites()
	font := gam.Font()
	nowMs := gam.NowMs()
	tick := gam.Tick()
	canvas := *gam.Canvas()
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		loop |= vals[i].Update(font, sprites, nowMs, tick, canvas)
	}
	return loop
}
