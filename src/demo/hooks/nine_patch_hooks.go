package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateClipFillNinePatches(
	vec *vvec.Vec[ventities.NinePatchEnt],
	gam *engine.Engine,
) vgame.Status {
	ents := vec.Vals()
	for i := range ents {
		ent := &ents[i]
		layer := gam.Layer(ent.Z().Layer())
		clip := layer.Clip
		ent.XY = clip.Min
		ent.WH = vgeo.NewWH(uint16(clip.W()), uint16(clip.H()))
		ent.Update(&layer.Sprs)
	}
	return vgame.Pause
}

func UpdateLvlEdgeNinePatches(
	vec *vvec.Vec[ventities.NinePatchEnt],
	gam *engine.Engine,
) vgame.Status {
	ui := gam.Layer(gfx.LayerUI)
	lvl := gam.Layer(gfx.LayerTiles)
	edge := lvlEdge(lvl.ClipPhy, *gam.CanvasPhy(), ui)

	ents := vec.Vals()
	for i := range ents {
		ent := &ents[i]
		ent.XY = edge.Min
		ent.WH = vgeo.NewWH(uint16(edge.W()), uint16(edge.H()))
		ent.Update(&ui.Sprs)
	}
	return vgame.Pause
}
