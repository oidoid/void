package vhooks

import (
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateNinePatches[Game vengine.Game](
	vec *vvec.Vec[ventities.NinePatchEnt],
	gam Game,
) vengine.Status {
	ents := vec.Vals()
	for i := range ents {
		ent := &ents[i]
		layer := gam.Layer(ent.Z().Layer())
		ent.Update(&layer.Sprs)
	}
	return vengine.Pause
}
