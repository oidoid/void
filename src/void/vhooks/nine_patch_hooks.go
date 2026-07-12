package vhooks

import (
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateNinePatches[Game vgame.Game](
	vec *vvec.Vec[ventities.NinePatchEnt],
	gam Game,
) vgame.Status {
	ents := vec.Vals()
	for i := range ents {
		ent := &ents[i]
		layer := gam.Layer(ent.Z().Layer())
		ent.Update(&layer.Sprites)
	}
	return vgame.Pause
}
