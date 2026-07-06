package vhooks

import (
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateTexts[Game vgame.Game](
	vec *vvec.Vec[ventities.TextEnt],
	gam Game,
) vgame.Status {
	// to-do: move _Layer_ not Z to Vec?
	font := gam.Font()
	ents := vec.Vals()
	loop := vgame.Pause
	for i := range ents {
		ent := &ents[i]
		layer := gam.Layer(ent.Z.Layer())
		sprites := &layer.Sprites
		loop |= ent.Update(font, sprites, layer.Clip)
	}
	return loop
}
