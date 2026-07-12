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
		ent.WH = vgeo.WH[uint16]{W: uint16(clip.W()), H: uint16(clip.H())}
		ent.Update(&layer.Sprites)
	}
	return vgame.Pause
}

func UpdateLevelClipNinePatches(
	vec *vvec.Vec[ventities.NinePatchEnt],
	gam *engine.Engine,
) vgame.Status {
	ui := gam.Layer(gfx.LayerUI)
	level := gam.Layer(gfx.LayerTiles)
	levelClipPhy := level.ClipPhy
	xy := ui.PhyToLayerInt(vgeo.NewXY(
		float32(levelClipPhy.Min.X),
		float32(levelClipPhy.Min.Y),
	))
	wh := ui.PhyToLayerWHInt(vgeo.WH[uint16]{
		W: levelClipPhy.W(),
		H: levelClipPhy.H(),
	})

	ents := vec.Vals()
	for i := range ents {
		ent := &ents[i]
		ent.XY = xy
		ent.WH = wh
		ent.Update(&ui.Sprites)
	}
	return vgame.Pause
}
