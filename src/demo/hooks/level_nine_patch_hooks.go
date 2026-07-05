package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateLevelNinePatches(
	ents *vvec.Vec[ventdata.NinePatchEnt],
	gam *engine.Engine,
) vgame.Status {
	ui := gam.Layer(gfx.LayerUI)
	level := gam.Layer(gfx.LayerTiles)
	levelClipPhy := level.ClipPhy
	uiScale := ui.ScaleOrDefault()
	minPhy := vgeo.NewXY(float32(levelClipPhy.Min.X), float32(levelClipPhy.Min.Y))
	min := ui.PhyToLayer(minPhy)
	const borderW, borderH = float32(1), float32(1)
	boxW := uint16(float32(levelClipPhy.W())/uiScale + borderW*2 + 0.5)
	boxH := uint16(float32(levelClipPhy.H())/uiScale + borderH*2 + 0.5)

	vals := ents.Vals()
	for i := range vals {
		ent := &vals[i]
		ent.XY = vgeo.NewXY(min.X-borderW, min.Y-borderH)
		ent.WH = vgeo.WH[uint16]{W: boxW, H: boxH}
		ent.Update(&ui.Sprites)
	}
	return vgame.Pause
}
