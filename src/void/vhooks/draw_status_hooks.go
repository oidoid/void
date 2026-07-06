package vhooks

import (
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateDrawStatuses[Game vgame.Game](
	vec *vvec.Vec[ventities.DrawStatusEnt],
	gam Game,
) vgame.Status {
	font := gam.Font()
	nowMs := gam.NowMs()
	tick := gam.Tick()
	ents := vec.Vals()
	loop := vgame.Pause
	for i := range ents {
		layer := gam.Layer(ents[i].Z.Layer())
		sprites := &layer.Sprites
		loop |= ents[i].Update(font, sprites, nowMs, tick, layer.Clip)
	}
	return loop
}
