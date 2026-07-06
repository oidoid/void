package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateClipNinePatches(
	ents *vvec.Vec[ventities.NinePatchEnt],
	gam *engine.Engine,
) vgame.Status {
	vals := ents.Vals()
	for i := range vals {
		ent := &vals[i]
		layer := gam.Layer(ent.Z.Layer())
		clip := layer.Clip
		ent.XY = clip.Min
		ent.WH = vgeo.WH[uint16]{W: uint16(clip.W()), H: uint16(clip.H())}
		ent.Update(&layer.Sprites)
	}
	return vgame.Pause
}
