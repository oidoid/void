package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateCamStatuses(
	vec *vvec.Vec[entities.CamStatusEnt],
	gam *engine.Engine,
) vgame.Status {
	font := gam.Font()
	canvasPhy := *gam.CanvasPhy()
	fullscreen := gam.Fullscreen()
	tiles := gam.Layer(gfx.LayerTiles)
	camLvl := tiles.PhyToLayerScale(vgeo.NewXY(gam.CamX(), gam.CamY()))
	scale := tiles.ScaleOrDefault()
	ents := vec.Vals()
	loop := vgame.Pause
	for i := range ents {
		layer := gam.Layer(ents[i].Z.Layer())
		sprs := &layer.Sprs
		loop |= ents[i].Update(
			font,
			sprs,
			canvasPhy,
			camLvl,
			fullscreen,
			scale,
			layer.Clip,
		)
	}
	return loop
}
