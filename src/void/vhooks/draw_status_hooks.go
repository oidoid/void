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
	font := gam.Font()
	nowMs := gam.NowMs()
	tick := gam.Tick()
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		layer := gam.Layer(vals[i].Z.Layer())
		sprites := &layer.Sprites
		loop |= vals[i].Update(font, sprites, nowMs, tick, layer.Clip)
	}
	return loop
}
