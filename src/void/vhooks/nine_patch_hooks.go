package vhooks

import (
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateNinePatches[Game vgame.Game](
	ents *vvec.Vec[ventities.NinePatchEnt],
	gam Game,
) vgame.Status {
	vals := ents.Vals()
	for i := range vals {
		ent := &vals[i]
		layer := gam.Layer(ent.Z.Layer())
		ent.Update(&layer.Sprites)
	}
	return vgame.Pause
}
