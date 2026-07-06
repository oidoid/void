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
		layer := gam.Layer(ent.Z.Layer())
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
	uiScale := ui.ScaleOrDefault()
	minPhy := vgeo.NewXY(float32(levelClipPhy.Min.X), float32(levelClipPhy.Min.Y))
	minXY := ui.PhyToLayer(minPhy)
	const borderW, borderH = float32(1), float32(1)
	boxW := uint16(float32(levelClipPhy.W())/uiScale + borderW*2 + 0.5)
	boxH := uint16(float32(levelClipPhy.H())/uiScale + borderH*2 + 0.5)

	ents := vec.Vals()
	for i := range ents {
		ent := &ents[i]
		ent.XY = vgeo.NewXY(minXY.X-borderW, minXY.Y-borderH)
		ent.WH = vgeo.WH[uint16]{W: boxW, H: boxH}
		ent.Update(&ui.Sprites)
	}
	return vgame.Pause
}
