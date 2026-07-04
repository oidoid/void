package vhooks

import (
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateTexts[Game vgame.Game](
	ents *vvec.Vec[ventdata.TextEnt],
	gam Game,
) vgame.Status {
	// to-do: move _Layer_ not Z to Vec?
	font := gam.Font()
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		ent := &vals[i]
		layer := gam.Layer(ent.Z.Layer())
		sprites := &layer.Sprites
		loop |= ent.Update(font, sprites, layer.Clip)
	}
	return loop
}
