package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
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
	cam := vgeo.NewXY(gam.CamX(), gam.CamY())
	fullscreen := gam.Fullscreen()
	ents := vec.Vals()
	loop := vgame.Pause
	for i := range ents {
		layer := gam.Layer(ents[i].Z.Layer())
		sprites := &layer.Sprites
		loop |= ents[i].Update(font, sprites, canvasPhy, cam, fullscreen, layer.Clip)
	}
	return loop
}
